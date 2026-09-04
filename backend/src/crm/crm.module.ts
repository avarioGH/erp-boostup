import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerController } from './customer.controller';
import { OrderController } from './order.controller';
import { VoucherController } from './voucher.controller';
import { QuotationModule } from './quotation/quotation.module';
import { DeliveryModule } from './delivery/delivery.module';

@Module({
  imports: [PrismaModule, QuotationModule, DeliveryModule],
  controllers: [CustomerController, OrderController, VoucherController],
})
export class CrmModule {}
