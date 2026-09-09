import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { PeriodController } from './period/period.controller';
import { FinanceService } from './finance.service';
import { PeriodService } from './period/period.service';
import { BankReconciliationController } from './bank-reconciliation/bank-reconciliation.controller';
import { BankReconciliationService } from './bank-reconciliation/bank-reconciliation.service';

import { PrismaModule } from '../prisma/prisma.module';
import { GlModule } from '../gl/gl.module';
import { InvoiceModule } from './invoice/invoice.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [PrismaModule, GlModule, InvoiceModule, PaymentModule],
  controllers: [FinanceController, PeriodController, BankReconciliationController],
  providers: [FinanceService, PeriodService, BankReconciliationService], exports: [FinanceService]
})
export class FinanceModule {}
