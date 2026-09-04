import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

import { PrismaModule } from '../prisma/prisma.module';
import { GlModule } from '../gl/gl.module';
import { InvoiceModule } from './invoice/invoice.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [PrismaModule, GlModule, InvoiceModule, PaymentModule],
  controllers: [FinanceController],
  providers: [FinanceService]
})
export class FinanceModule {}
