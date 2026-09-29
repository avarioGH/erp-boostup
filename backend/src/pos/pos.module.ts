import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [PrismaModule, InventoryModule, ReportsModule],
  controllers: [PosController],
  providers: [PosService]
})
export class PosModule {}
