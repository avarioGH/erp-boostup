import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { OrderController } from './order.controller';
import { DeliveryModule } from './delivery/delivery.module';
import { QuotationModule } from './quotation/quotation.module';
import { VoucherController } from './voucher.controller';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';

@Module({
  imports: [DeliveryModule, QuotationModule],
  controllers: [
    CustomerController, 
    OrderController, 
    VoucherController,
    CrmController
  ],
  providers: [CrmService],
  exports: [CrmService]
})
export class CrmModule {}
