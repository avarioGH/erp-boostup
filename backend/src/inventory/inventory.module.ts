import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { RawLogController } from './raw-log.controller';
import { RawLogService } from './raw-log.service';
import { TrimmedLogController } from './trimmed-log.controller';
import { TrimmedLogService } from './trimmed-log.service';
import { InputLogController } from './input-log.controller';
import { InputLogService } from './input-log.service';
import { SawnTimberController } from './sawn-timber.controller';
import { SawnTimberService } from './sawn-timber.service';
import { TimberLedgerController } from './timber-ledger.controller';
import { InventoryLedgerService } from './inventory-ledger.service';
import { StockTransferService } from './stock-transfer.service';
import { StockAdjustmentService } from './stock-adjustment.service';
import { ImportController } from './import/import.controller';
import { ImportService } from './import/import.service';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TimberCalculationService } from './timber-calculation.service';
import { SawmillProductionController } from './sawmill-production.controller';
import { SawmillProductionService } from './sawmill-production.service';

@Module({
  controllers: [
    InventoryController, 
    RawLogController, 
    TrimmedLogController,
    InputLogController,
    SawnTimberController,
    TimberLedgerController,
    ImportController,
    ReportController,
    SawmillProductionController
  ],
  providers: [
    InventoryService, 
    RawLogService, 
    TrimmedLogService,
    InputLogService,
    SawnTimberService,
    InventoryLedgerService,
    StockTransferService,
    StockAdjustmentService,
    ImportService,
    ReportService,
    TimberCalculationService,
    SawmillProductionService
  ],
  exports: [
    InventoryService, 
    RawLogService, 
    TrimmedLogService,
    InputLogService,
    SawnTimberService,
    InventoryLedgerService,
    StockTransferService,
    StockAdjustmentService,
    ImportService,
    ReportService,
    TimberCalculationService,
    SawmillProductionService
  ]
})
export class InventoryModule {}


