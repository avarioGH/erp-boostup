import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';

@Module({
  imports: [require('../../inventory/inventory.module').InventoryModule],
  providers: [DeliveryService],
  controllers: [DeliveryController]
})
export class DeliveryModule {}
