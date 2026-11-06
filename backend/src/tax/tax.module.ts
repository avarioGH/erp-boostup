import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TaxService } from './tax.service';
import { TaxEngineService } from './tax-engine.service';
import { TaxController } from './tax.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TaxController],
  providers: [TaxService, TaxEngineService],
  exports: [TaxService, TaxEngineService],
})
export class TaxModule {}
