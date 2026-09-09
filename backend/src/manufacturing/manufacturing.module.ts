import { Module } from '@nestjs/common';
import { QualityController } from './quality/quality.controller';
import { QualityService } from './quality/quality.service';
import { MoController } from './mo/mo.controller';
import { MoService } from './mo/mo.service';
import { SchedulingController } from './scheduling/scheduling.controller';
import { SchedulingService } from './scheduling/scheduling.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QualityController, MoController, SchedulingController],
  providers: [QualityService, MoService, SchedulingService],
})
export class ManufacturingModule {}

