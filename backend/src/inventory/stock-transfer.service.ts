import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryLedgerService } from './inventory-ledger.service';
import { AuditService } from '../core/audit.service';

@Injectable()
export class StockTransferService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: InventoryLedgerService,
    private audit: AuditService,
  ) {}

  async listTransfers(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: string;
    fromLocationId?: string;
    toLocationId?: string;
    startDate?: string;
    endDate?: string;
    fromLocationCodePrefix?: string;
    toLocationCodePrefix?: string;
  }) {
    const {
      skip = 0,
      take = 50,
      search,
      status,
      fromLocationId,
      toLocationId,
      startDate,
      endDate,
      fromLocationCodePrefix,
      toLocationCodePrefix,
    } = params;
    const where: any = {};
    if (search)
      where.transferNumber = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    if (fromLocationId) where.fromLocationId = fromLocationId;
    if (toLocationId) where.toLocationId = toLocationId;

    if (startDate || endDate) {
      where.transferDate = {};
      if (startDate) where.transferDate.gte = new Date(startDate);
      if (endDate) where.transferDate.lte = new Date(endDate);
    }

    if (fromLocationCodePrefix || toLocationCodePrefix) {
      if (fromLocationCodePrefix && toLocationCodePrefix) {
        where.OR = [
          { fromLocation: { code: { startsWith: fromLocationCodePrefix } } },
          { toLocation: { code: { startsWith: toLocationCodePrefix } } },
        ];
      } else if (fromLocationCodePrefix) {
        where.fromLocation = { code: { startsWith: fromLocationCodePrefix } };
      } else if (toLocationCodePrefix) {
        where.toLocation = { code: { startsWith: toLocationCodePrefix } };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({
        skip: Number(skip),
        take: Number(take),
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          fromLocation: true,
          toLocation: true,
          items: { include: { timberVariant: true } },
        },
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);
    return { items, total, skip: Number(skip), take: Number(take) };
  }

  async getTransfer(id: string) {
    const t = await this.prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        fromLocation: true,
        toLocation: true,
        items: { include: { timberVariant: true } },
      },
    });
    if (!t) throw new NotFoundException('Transfer not found');
    return t;
  }

  async createTransfer(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const {
        transferDate,
        fromLocationId,
        toLocationId,
        notes,
        items,
        createdBy,
      } = data;

      if (!items || items.length === 0)
        throw new BadRequestException('Transfer must contain items');
      if (fromLocationId === toLocationId)
        throw new BadRequestException(
          'Source and destination cannot be the same',
        );

      const dateObj = transferDate ? new Date(transferDate) : new Date();
      const YY = String(dateObj.getFullYear()).slice(2);
      const MM = String(dateObj.getMonth() + 1).padStart(2, '0');

      const count = await tx.stockTransfer.count({
        where: { transferNumber: { startsWith: `TRF-${YY}${MM}` } },
      });
      const seq = String(count + 1).padStart(4, '0');
      const transferNumber = `TRF-${YY}${MM}-${seq}`;

      const transfer = await tx.stockTransfer.create({
        data: {
          transferNumber,
          transferDate: dateObj,
          fromLocationId,
          toLocationId,
          notes,
          createdBy,
          status: 'DRAFT',
        },
      });

      // Aggregate quantities per (variantId, batch) to validate aggregate source availability
      const aggregatedRequests = new Map<string, { variantId: string; batch: string; totalQty: number; items: any[] }>();

      for (const item of items) {
        if (!item.timberVariantId) {
          throw new BadRequestException('Timber variant ID is required for each transfer item');
        }
        if (!item.quantityPcs || Number(item.quantityPcs) <= 0) {
          throw new BadRequestException('Quantity must be positive');
        }

        const requestedQty = Number(item.quantityPcs);
        const itemBatch = item.batch ? String(item.batch).trim() : 'UNKNOWN';
        const key = `${item.timberVariantId}___${itemBatch}`;

        if (!aggregatedRequests.has(key)) {
          aggregatedRequests.set(key, {
            variantId: item.timberVariantId,
            batch: itemBatch,
            totalQty: 0,
            items: [],
          });
        }
        const entry = aggregatedRequests.get(key)!;
        entry.totalQty += requestedQty;
        entry.items.push(item);
      }

      // Validate each aggregated bucket against source stock
      for (const [key, entry] of aggregatedRequests.entries()) {
        const { variantId, batch: itemBatch, totalQty } = entry;

        // Check if there is stock with a known non-UNKNOWN batch at this location for this variant
        const knownBatchStocks = await tx.timberStock.findMany({
          where: {
            locationId: fromLocationId,
            timberVariantId: variantId,
            currentPcs: { gt: 0 },
            batch: { not: 'UNKNOWN' },
          },
        });

        if (knownBatchStocks.length > 0 && itemBatch === 'UNKNOWN') {
          throw new BadRequestException(
            `Source stock has known batches (${knownBatchStocks.map((s: any) => s.batch).join(', ')}). You must explicitly select a batch.`,
          );
        }

        // Validate source stock availability for this exact batch
        const sourceStock = await tx.timberStock.findUnique({
          where: {
            locationId_timberVariantId_batch: {
              locationId: fromLocationId,
              timberVariantId: variantId,
              batch: itemBatch,
            },
          },
        });

        if (!sourceStock || sourceStock.currentPcs < totalQty) {
          throw new BadRequestException(
            `Insufficient stock for variant ${variantId} with batch "${itemBatch}" at source warehouse. Available: ${sourceStock?.currentPcs || 0} PCS, Total Requested: ${totalQty} PCS.`,
          );
        }

        // Process individual items in this bucket with authoritative proportional volume
        for (const item of entry.items) {
          const qty = Number(item.quantityPcs);
          // Authoritative volume derivation: if transferring entire remaining stock, take full volume; otherwise proportional
          let volM3 = 0;
          if (qty === sourceStock.currentPcs) {
            volM3 = Number(sourceStock.currentVolumeM3.toFixed(4));
          } else if (sourceStock.currentPcs > 0) {
            volM3 = Number(((qty / sourceStock.currentPcs) * sourceStock.currentVolumeM3).toFixed(4));
          }

          // If client sent an explicit volume, ensure it doesn't deviate wildly (> 5%) from authoritative proportional volume
          if (item.volumeM3 && Number(item.volumeM3) > 0) {
            const clientVol = Number(item.volumeM3);
            if (volM3 > 0 && Math.abs(clientVol - volM3) / volM3 > 0.05) {
              throw new BadRequestException(
                `Submitted volume (${clientVol} M³) deviates from authoritative proportional volume (${volM3} M³) for ${qty} PCS.`,
              );
            }
          }

          await tx.stockTransferItem.create({
            data: {
              transferId: transfer.id,
              timberVariantId: variantId,
              batch: itemBatch,
              quantityPcs: qty,
              volumeM3: volM3,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'STOCK_TRANSFER',
          entity_id: transfer.id,
          after_data: { status: transfer.status },
        },
      });
      return transfer;
    });
  }

  async postTransfer(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'DRAFT')
        throw new BadRequestException('Only DRAFT transfers can be posted');

      // Re-validate aggregate source stock availability inside transaction before mutating
      const postAggregates = new Map<string, { variantId: string; batch: string; totalQty: number }>();
      for (const item of transfer.items) {
        const itemBatch = item.batch || 'UNKNOWN';
        const key = `${item.timberVariantId}___${itemBatch}`;
        if (!postAggregates.has(key)) {
          postAggregates.set(key, { variantId: item.timberVariantId, batch: itemBatch, totalQty: 0 });
        }
        postAggregates.get(key)!.totalQty += item.quantityPcs;
      }

      for (const [key, agg] of postAggregates.entries()) {
        const sourceStock = await tx.timberStock.findUnique({
          where: {
            locationId_timberVariantId_batch: {
              locationId: transfer.fromLocationId,
              timberVariantId: agg.variantId,
              batch: agg.batch,
            },
          },
        });

        if (!sourceStock || sourceStock.currentPcs < agg.totalQty) {
          throw new BadRequestException(
            `Cannot post transfer. Insufficient stock for variant ${agg.variantId} with batch "${agg.batch}". Available: ${sourceStock?.currentPcs || 0} PCS, Total Required: ${agg.totalQty} PCS.`,
          );
        }
      }

      await tx.stockTransfer.update({
        where: { id },
        data: { status: 'POSTED' },
      });

      for (const item of transfer.items) {
        // 1. OUT from source (atomic concurrency guard in InventoryLedgerService)
        await this.ledgerService.createMovement(
          tx as any,
          transfer.fromLocationId,
          item.timberVariantId,
          'OUT',
          'TRANSFER_OUT',
          transfer.id,
          item.quantityPcs,
          item.volumeM3,
          item.batch || 'UNKNOWN',
        );
        // 2. IN to destination
        await this.ledgerService.createMovement(
          tx as any,
          transfer.toLocationId,
          item.timberVariantId,
          'IN',
          'TRANSFER_IN',
          transfer.id,
          item.quantityPcs,
          item.volumeM3,
          item.batch || 'UNKNOWN',
        );
      }

      await tx.auditLog.create({
        data: {
          action: 'POST',
          entity: 'STOCK_TRANSFER',
          entity_id: id,
          before_data: { status: 'DRAFT' },
          after_data: { status: 'POSTED' },
        },
      });
      return transfer;
    });
  }

  async cancelTransfer(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status === 'CANCELLED')
        throw new BadRequestException('Already cancelled');

      if (transfer.status === 'POSTED') {
        for (const item of transfer.items) {
          // Reverse IN from destination (OUT)
          await this.ledgerService.createMovement(
            tx as any,
            transfer.toLocationId,
            item.timberVariantId,
            'OUT',
            'REVERSAL',
            transfer.id,
            item.quantityPcs,
            item.volumeM3,
            item.batch || 'UNKNOWN',
          );
          // Reverse OUT from source (IN)
          await this.ledgerService.createMovement(
            tx as any,
            transfer.fromLocationId,
            item.timberVariantId,
            'IN',
            'REVERSAL',
            transfer.id,
            item.quantityPcs,
            item.volumeM3,
            item.batch || 'UNKNOWN',
          );
        }
      }

      await tx.stockTransfer.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      await tx.auditLog.create({
        data: {
          action: 'CANCEL',
          entity: 'STOCK_TRANSFER',
          entity_id: id,
          before_data: { status: transfer.status },
          after_data: { status: 'CANCELLED' },
        },
      });
      return transfer;
    });
  }
}
