import { PaymentModule } from '../../finance/payment/payment.module';
import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';
import { SalesOrderController } from './sales-order.controller';

@Module({
  imports: [PaymentModule],
  providers: [QuotationService],
  controllers: [QuotationController, SalesOrderController],
})
export class QuotationModule {}
