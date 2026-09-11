import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryLedgerService } from './inventory-ledger.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SawmillProductionService {
  constructor(
    private prisma: PrismaService,
    private ledgerService: InventoryLedgerService
  ) {}

  async getRemainingInputVolume(inputLogId: string) {
    const inputLog = await this.prisma.inputLog.findUnique({
      where: { id: inputLogId },
      include: { sawmillConsumptions: true }
    });
    if (!inputLog) throw new NotFoundException('Input log not found');
    const consumed = inputLog.sawmillConsumptions.reduce((sum, c) => sum + c.consumedM3, 0);
    return {
      totalVolume: inputLog.totalVolume,
      consumedVolume: consumed,
      remainingVolume: Math.max(0, inputLog.totalVolume - consumed)
    };
  }

  private async generateBundleNumber(tx: Prisma.TransactionClient, companyId: string, shift: string, date: Date) {
    const YY = String(date.getFullYear()).slice(2);
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `O-MSAW-${shift}-${YY}-${MM}-`;
    
    const seq = await tx.documentSequence.upsert({
      where: { company_id_type_prefix: { company_id: companyId, type: 'SAWMILL_BUNDLE', prefix } },
      create: { company_id: companyId, type: 'SAWMILL_BUNDLE', prefix, last_value: 1 },
      update: { last_value: { increment: 1 } }
    });
    return `${prefix}${String(seq.last_value).padStart(3, '0')}`;
  }

  private async generateProductionNo(tx: Prisma.TransactionClient, companyId: string) {
    const prefix = `PRD-`;
    const seq = await tx.documentSequence.upsert({
      where: { company_id_type_prefix: { company_id: companyId, type: 'SAWMILL_PRD', prefix } },
      create: { company_id: companyId, type: 'SAWMILL_PRD', prefix, last_value: 1 },
      update: { last_value: { increment: 1 } }
    });
    return `${prefix}${String(seq.last_value).padStart(6, '0')}`;
  }

  async createProductionRun(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const { companyId, productionDate, shift, operatorId, workCenterId, notes, consumptions, items, locationId } = data;
      
      const productionNo = await this.generateProductionNo(tx, companyId);
      const dateObj = new Date(productionDate);

      // Validate inputs
      for (const c of consumptions) {
        if (c.consumedM3 <= 0) throw new BadRequestException('Consumed M3 must be positive');
        const inputLog = await tx.inputLog.findUnique({
          where: { id: c.inputLogId },
          include: { sawmillConsumptions: true }
        });
        if (!inputLog) throw new NotFoundException(`InputLog ${c.inputLogId} not found`);
        
        const alreadyConsumed = inputLog.sawmillConsumptions.reduce((sum, cc) => sum + cc.consumedM3, 0);
        if (alreadyConsumed + c.consumedM3 > inputLog.totalVolume) {
          throw new BadRequestException(`InputLog ${inputLog.inputNumber} has insufficient remaining volume. Have ${inputLog.totalVolume - alreadyConsumed}, tried to consume ${c.consumedM3}`);
        }
      }

      const run = await tx.sawmillProductionRun.create({
        data: {
          productionNo,
          productionDate: dateObj,
          shift,
          operatorId,
          workCenterId,
          notes,
          consumptions: {
            create: consumptions.map(c => ({
              inputLogId: c.inputLogId,
              consumedM3: c.consumedM3
            }))
          }
        }
      });

      // Group items by bundle if they share one, but since we are generating new bundles:
      // For simplicity, if the client sends items clustered in bundles, we create them.
      for (const bundleData of items) { // bundleData contains variants
        const bundleNumber = await this.generateBundleNumber(tx, companyId, shift, dateObj);
        const bundle = await tx.sawmillBundle.create({
          data: { bundleNumber, status: 'ACTIVE' }
        });

        for (const variantData of bundleData.variants) {
          const variant = await tx.timberVariant.findUnique({ where: { id: variantData.timberVariantId } });
          if (!variant) throw new NotFoundException(`Variant not found`);
          
          // Strict volume calculation server-side!
          const expectedVolume = (variant.thickness * variant.width * variant.length * variantData.quantityPcs) / 1000000000;

          await tx.sawmillOutputItem.create({
            data: {
              productionRunId: run.id,
              bundleId: bundle.id,
              timberVariantId: variant.id,
              partai: variantData.partai,
              quantityPcs: variantData.quantityPcs,
              volumeM3: expectedVolume,
              remarks: variantData.remarks
            }
          });
        }
      }

      return run;
    });
  }

  async postProductionRun(id: string, locationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const run = await tx.sawmillProductionRun.findUnique({
        where: { id },
        include: { outputItems: true }
      });
      if (!run) throw new NotFoundException('Production run not found');
      if (run.status !== 'DRAFT') throw new BadRequestException('Only DRAFT can be posted');

      await tx.sawmillProductionRun.update({ where: { id }, data: { status: 'POSTED' } });

      for (const item of run.outputItems) {
        if (item.stockMovementId) throw new BadRequestException('Already has stock movement');
        
        const mov = await this.ledgerService.createMovement(
          tx,
          locationId,
          item.timberVariantId,
          'IN',
          'PRODUCTION_OUTPUT',
          run.id,
          item.quantityPcs,
          item.volumeM3
        );

        await tx.sawmillOutputItem.update({
          where: { id: item.id },
          data: { stockMovementId: mov.id }
        });
      }

      return run;
    });
  }

  async cancelProductionRun(id: string, locationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const run = await tx.sawmillProductionRun.findUnique({
        where: { id },
        include: { outputItems: true }
      });
      if (!run) throw new NotFoundException('Production run not found');
      if (run.status === 'CANCELLED') throw new BadRequestException('Already cancelled');

      if (run.status === 'POSTED') {
        for (const item of run.outputItems) {
          if (!item.stockMovementId) continue;
          
          const mov = await this.ledgerService.createMovement(
            tx,
            locationId,
            item.timberVariantId,
            'OUT',
            'REVERSAL',
            run.id, // linked to production run
            item.quantityPcs,
            item.volumeM3
          );

          await tx.sawmillOutputItem.update({
            where: { id: item.id },
            data: { reversalMovementId: mov.id }
          });
        }
      }

      await tx.sawmillProductionRun.update({ where: { id }, data: { status: 'CANCELLED' } });
      return run;
    });
  }
}
