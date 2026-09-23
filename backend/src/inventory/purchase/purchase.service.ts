import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryLedgerService } from '../inventory-ledger.service';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryLedgerService: InventoryLedgerService,
  ) {}

  async create(companyId: string, data: any) {
    const { purchaseNumber, purchaseDate, sourceId, warehouseId, notes, items } = data;

    // Validate if purchaseNumber exists
    const existing = await this.prisma.timberPurchase.findUnique({
      where: { purchaseNumber }
    });
    if (existing) {
      throw new BadRequestException(`Purchase with number ${purchaseNumber} already exists`);
    }

    let totalPcs = 0;
    let totalVolumeM3 = 0;
    
    for (const item of items) {
      totalPcs += item.quantityPcs;
      totalVolumeM3 += item.volumeM3;
    }

    const purchase = await this.prisma.timberPurchase.create({
      data: {
        company_id: companyId,
        purchaseNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        sourceId,
        warehouseId,
        notes,
        status: 'DRAFT',
        totalPcs,
        totalVolumeM3,
        items: {
          create: items.map(item => ({
            timberVariantId: item.timberVariantId,
            quantityPcs: item.quantityPcs,
            volumeM3: item.volumeM3
          }))
        }
      },
      include: {
        items: true
      }
    });

    return purchase;
  }

  async confirm(id: string, companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.timberPurchase.findFirst({
        where: { id, company_id: companyId },
        include: { items: true }
      });

      if (!purchase) {
        throw new NotFoundException('Timber purchase not found');
      }

      if (purchase.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT purchase can be confirmed');
      }

      // Update status
      const confirmed = await tx.timberPurchase.update({
        where: { id },
        data: { status: 'CONFIRMED' }
      });

      // Stock mutations
      for (const item of purchase.items) {
        await this.inventoryLedgerService.createMovement(
          tx,
          purchase.warehouseId,
          item.timberVariantId,
          'IN',
          'TIMBER_PURCHASE',
          purchase.id,
          item.quantityPcs,
          item.volumeM3
        );
      }

      return confirmed;
    });
  }

  async cancel(id: string, companyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.timberPurchase.findFirst({
        where: { id, company_id: companyId },
        include: { items: true }
      });

      if (!purchase) {
        throw new NotFoundException('Timber purchase not found');
      }

      if (purchase.status !== 'CONFIRMED') {
        throw new BadRequestException('Only CONFIRMED purchase can be cancelled');
      }

      // Update status
      const cancelled = await tx.timberPurchase.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      // Stock mutations (reversal)
      for (const item of purchase.items) {
        // Pre-flight check: we need enough stock to reverse
        const stock = await tx.timberStock.findUnique({
          where: {
            locationId_timberVariantId: {
              locationId: purchase.warehouseId,
              timberVariantId: item.timberVariantId
            }
          }
        });

        if (!stock || stock.currentPcs < item.quantityPcs) {
          throw new BadRequestException(`Insufficient stock to cancel purchase for variant ${item.timberVariantId}`);
        }

        await this.inventoryLedgerService.createMovement(
          tx,
          purchase.warehouseId,
          item.timberVariantId,
          'OUT',
          'TIMBER_PURCHASE_REVERSAL',
          purchase.id,
          item.quantityPcs,
          item.volumeM3
        );
      }

      return cancelled;
    });
  }

  async findAll(companyId: string) {
    return this.prisma.timberPurchase.findMany({
      where: { company_id: companyId },
      include: {
        source: true,
        warehouse: true,
        items: {
          include: {
            timberVariant: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, companyId: string) {
    const purchase = await this.prisma.timberPurchase.findFirst({
      where: { id, company_id: companyId },
      include: {
        source: true,
        warehouse: true,
        items: {
          include: {
            timberVariant: true
          }
        }
      }
    });

    if (!purchase) {
      throw new NotFoundException('Timber purchase not found');
    }

    return purchase;
  }
}
