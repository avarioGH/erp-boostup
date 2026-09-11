import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type MovementType = 'IN' | 'OUT' | 'ADJ';
export type ReferenceType = 'OPENING_BALANCE' | 'PRODUCTION_OUTPUT' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'REVERSAL' | 'SALES_DELIVERY';

@Injectable()
export class InventoryLedgerService {
  constructor(private prisma: PrismaService) {}

  /**
   * Centralized method for all stock mutations.
   * MUST be executed inside an existing Prisma transaction.
   */
  async createMovement(
    tx: Prisma.TransactionClient,
    locationId: string,
    timberVariantId: string,
    type: MovementType,
    referenceType: ReferenceType,
    referenceId: string,
    quantityPcs: number,
    volumeM3: number
  ) {
    if (quantityPcs <= 0 || volumeM3 <= 0) {
      throw new BadRequestException('Quantity and volume must be positive');
    }

    // 1. Get or create stock with row-level locking equivalent (Pessimistic update check later)
    let stock = await tx.timberStock.findUnique({
      where: { locationId_timberVariantId: { locationId, timberVariantId } }
    });

    if (!stock) {
      if (type === 'OUT') {
        throw new BadRequestException('Insufficient stock (No stock record exists)');
      }
      stock = await tx.timberStock.create({
        data: { locationId, timberVariantId, currentPcs: 0, currentVolumeM3: 0 }
      });
    } else {
      if (type === 'OUT' && stock.currentPcs < quantityPcs) {
        throw new BadRequestException(`Insufficient stock for variant ${timberVariantId}. Have ${stock.currentPcs}, need ${quantityPcs}`);
      }
    }

    // 2. Create immutable movement
    const movement = await tx.timberStockMovement.create({
      data: {
        timberStockId: stock.id,
        type,
        referenceType,
        referenceId,
        quantityPcs,
        volumeM3
      }
    });

    // 3. Increment/Decrement Cache Atomically
    const updateData: any = {};
    if (type === 'IN') {
      updateData.stockInPcs = { increment: quantityPcs };
      updateData.currentPcs = { increment: quantityPcs };
      updateData.currentVolumeM3 = { increment: volumeM3 };
    } else if (type === 'OUT') {
      updateData.stockOutPcs = { increment: quantityPcs };
      updateData.currentPcs = { decrement: quantityPcs };
      updateData.currentVolumeM3 = { decrement: volumeM3 };
    } else if (type === 'ADJ') {
      updateData.adjustmentPcs = { increment: quantityPcs }; // Could be neg/pos depending on how we want to track
      updateData.currentPcs = { increment: quantityPcs };
      updateData.currentVolumeM3 = { increment: volumeM3 };
    }

    await tx.timberStock.update({
      where: { id: stock.id },
      data: updateData
    });

    return movement;
  }
}
