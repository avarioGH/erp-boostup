import { Module } from '@nestjs/common';
import { BatchReclassificationController } from './batch-reclassification.controller';
import { BatchReclassificationService } from './batch-reclassification.service';
import { InventoryLedgerService } from '../inventory-ledger.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BatchReclassificationController],
  providers: [BatchReclassificationService, InventoryLedgerService],
  exports: [BatchReclassificationService],
})
export class BatchReclassificationModule {}
