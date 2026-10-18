import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryLedgerService } from '../inventory-ledger.service';

@Injectable()
export class OpnameService {
  constructor(
    private prisma: PrismaService,
    private ledger: InventoryLedgerService,
  ) {}

  async createDraft(warehouseId: string, companyId: string, userId?: string) {
    if (!companyId) {
      throw new BadRequestException('Authenticated company context is required');
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, company_id: companyId },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found or access denied');
    }

    const stocks = await this.prisma.timberStock.findMany({
      where: { locationId: warehouseId },
      include: { timberVariant: true },
    });

    return this.prisma.timberStockOpname.create({
      data: {
        company_id: companyId,
        opnameNumber: `OPN-${Date.now()}`,
        warehouseId,
        status: 'DRAFT',
        createdBy: userId,
        items: {
          create: stocks.map((stock) => ({
            timberVariantId: stock.timberVariantId,
            batch: stock.batch,
            systemQuantityPcs: stock.currentPcs,
            systemVolumeM3: stock.currentVolumeM3,
            physicalQuantityPcs: 0,
            physicalVolumeM3: 0,
            varianceQuantityPcs: -stock.currentPcs,
            varianceVolumeM3: -stock.currentVolumeM3,
          })),
        },
      },
      include: { items: true },
    });
  }

  async updateCounts(
    id: string,
    companyId: string,
    items: {
      itemId: string;
      physicalQuantityPcs: number;
      physicalVolumeM3: number;
    }[],
  ) {
    if (!companyId) {
      throw new BadRequestException('Authenticated company context is required');
    }

    const opname = await this.prisma.timberStockOpname.findFirst({
      where: { id, company_id: companyId },
      include: { items: true },
    });
    if (!opname) {
      throw new NotFoundException('Opname not found or access denied');
    }
    if (opname.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT opnames can be updated');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const input of items) {
        const item = opname.items.find((i) => i.id === input.itemId);
        if (!item) continue;

        const varianceQuantityPcs =
          input.physicalQuantityPcs - item.systemQuantityPcs;
        const varianceVolumeM3 = Number(
          (input.physicalVolumeM3 - item.systemVolumeM3).toFixed(4),
        );

        await tx.timberStockOpnameItem.update({
          where: { id: input.itemId },
          data: {
            physicalQuantityPcs: input.physicalQuantityPcs,
            physicalVolumeM3: input.physicalVolumeM3,
            varianceQuantityPcs,
            varianceVolumeM3,
          },
        });
      }
      return tx.timberStockOpname.findUnique({
        where: { id },
        include: { items: true },
      });
    });
  }

  async confirmOpname(id: string, companyId: string, userId?: string) {
    if (!companyId) {
      throw new BadRequestException('Authenticated company context is required');
    }

    const opname = await this.prisma.timberStockOpname.findFirst({
      where: { id, company_id: companyId },
      include: { items: true },
    });
    if (!opname) {
      throw new NotFoundException('Opname not found or access denied');
    }
    if (opname.status !== 'DRAFT') {
      throw new BadRequestException('Can only confirm DRAFT opnames');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Optimistic status guard against duplicate / concurrent confirmation
      const updateStatusResult = await tx.timberStockOpname.updateMany({
        where: { id, status: 'DRAFT', company_id: companyId },
        data: {
          status: 'CONFIRMED',
          confirmedBy: userId,
          confirmedAt: new Date(),
        },
      });

      if (updateStatusResult.count === 0) {
        throw new BadRequestException(
          'Opname is no longer in DRAFT status or is already confirmed/cancelled',
        );
      }

      // 2. Validate variance signs and stale snapshots for every item
      for (const item of opname.items) {
        const dPcs = item.varianceQuantityPcs;
        const dM3 = item.varianceVolumeM3;

        // Skip items with zero variance
        if (dPcs === 0 && Math.abs(dM3) < 0.0001) {
          continue;
        }

        // Fix 1: Invariant check - PCS and M3 variances must be in the exact same direction and non-zero
        const pcsPositive = dPcs > 0;
        const pcsNegative = dPcs < 0;
        const m3Positive = dM3 > 0.00001;
        const m3Negative = dM3 < -0.00001;

        if (
          (pcsPositive && m3Negative) ||
          (pcsNegative && m3Positive) ||
          (dPcs === 0 && Math.abs(dM3) >= 0.0001) ||
          (dPcs !== 0 && Math.abs(dM3) < 0.0001)
        ) {
          throw new BadRequestException(
            `Inconsistent variance detected for variant ${item.timberVariantId} (batch: ${item.batch}). Quantity PCS variance (${dPcs}) and Volume M3 variance (${dM3}) must have the same directional sign and both be non-zero for physical stock adjustments.`,
          );
        }

        // Fix 2: Stale snapshot guard - verify current stock still matches opname base snapshot
        const currentStock = await tx.timberStock.findUnique({
          where: {
            locationId_timberVariantId_batch: {
              locationId: opname.warehouseId,
              timberVariantId: item.timberVariantId,
              batch: item.batch,
            },
          },
        });

        const actualCurrentPcs = currentStock ? currentStock.currentPcs : 0;
        const actualCurrentM3 = currentStock ? currentStock.currentVolumeM3 : 0;

        if (
          actualCurrentPcs !== item.systemQuantityPcs ||
          Math.abs(actualCurrentM3 - item.systemVolumeM3) > 0.0001
        ) {
          throw new BadRequestException(
            `Stale stock snapshot detected for variant ${item.timberVariantId} (batch: ${item.batch}). System stock changed since opname draft was created (Recorded baseline: ${item.systemQuantityPcs} pcs, ${item.systemVolumeM3} m3 | Current stock: ${actualCurrentPcs} pcs, ${actualCurrentM3} m3). Confirmation rejected; please refresh and recount.`,
          );
        }

        const type = pcsPositive ? 'IN' : 'OUT';
        const q = Math.abs(dPcs);
        const v = Math.abs(dM3);

        await this.ledger.createMovement(
          tx,
          opname.warehouseId,
          item.timberVariantId,
          type,
          'STOCK_OPNAME_ADJUSTMENT',
          opname.id,
          q,
          v,
          item.batch,
        );
      }

      return tx.timberStockOpname.findUnique({
        where: { id },
        include: { items: true },
      });
    });
  }

  async cancelOpname(id: string, companyId: string) {
    if (!companyId) {
      throw new BadRequestException('Authenticated company context is required');
    }

    const opname = await this.prisma.timberStockOpname.findFirst({
      where: { id, company_id: companyId },
    });
    if (!opname) {
      throw new NotFoundException('Opname not found or access denied');
    }

    if (opname.status === 'CONFIRMED') {
      throw new BadRequestException(
        'Confirmed opnames cannot be cancelled. Please create a new opname to correct the variance.',
      );
    }

    if (opname.status === 'CANCELLED') {
      throw new BadRequestException('Opname is already cancelled');
    }

    const result = await this.prisma.timberStockOpname.updateMany({
      where: { id, company_id: companyId, status: 'DRAFT' },
      data: { status: 'CANCELLED' },
    });

    if (result.count === 0) {
      throw new BadRequestException('Only DRAFT opnames can be cancelled');
    }

    return this.prisma.timberStockOpname.findUnique({
      where: { id },
    });
  }

  async reconcile(companyId?: string) {
    const where: any = {};
    if (companyId) {
      // Find warehouses belonging to company
      const warehouses = await this.prisma.warehouse.findMany({
        where: { company_id: companyId },
        select: { id: true },
      });
      const warehouseIds = warehouses.map((w) => w.id);
      where.locationId = { in: warehouseIds };
    }

    const stocks = await this.prisma.timberStock.findMany({ where });
    const discrepancies: any[] = [];

    for (const stock of stocks) {
      const movements = await this.prisma.timberStockMovement.findMany({
        where: { timberStockId: stock.id },
      });

      let ledgerPcs = 0;

      for (const mov of movements) {
        if (mov.type === 'IN') {
          ledgerPcs += mov.quantityPcs;
        } else if (mov.type === 'OUT') {
          ledgerPcs -= mov.quantityPcs;
        }
      }

      const diff = stock.currentPcs - ledgerPcs;

      if (diff !== 0) {
        discrepancies.push({
          stockId: stock.id,
          variant: stock.timberVariantId,
          systemPcs: stock.currentPcs,
          ledgerPcs,
          diff,
        });
      }
    }

    return discrepancies;
  }
}
