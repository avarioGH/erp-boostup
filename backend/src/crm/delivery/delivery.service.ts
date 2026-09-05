import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, salesOrderId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findFirst({
        where: { id: salesOrderId, company_id: companyId },
        include: { items: true, deliveries: { include: { items: true } } }
      });
      if (!so) throw new NotFoundException('Sales order not found');

      const deliveryNumber = "DO-${Date.now()}";

      // Calculate delivered so far
      const deliveredMap = {};
      so.deliveries.forEach(d => {
        d.items.forEach(i => {
          deliveredMap[i.product_id] = (deliveredMap[i.product_id] || 0) + i.delivered_qty;
        });
      });

      const itemsToDeliver = data.items; // { productId, qty }
      const deliveryItems: any[] = [];

      for (const reqItem of itemsToDeliver) {
        const soItem = so.items.find(i => i.product_id === reqItem.productId);
        if (!soItem) throw new BadRequestException('Product not in Sales Order');

        const alreadyDelivered = deliveredMap[reqItem.productId] || 0;
        const remaining = soItem.qty - alreadyDelivered;

        if (reqItem.qty > remaining) {
          throw new BadRequestException("Cannot deliver more than ordered for product ${reqItem.productId}");
        }

        deliveryItems.push({
          product_id: reqItem.productId,
          ordered_qty: soItem.qty,
          delivered_qty: reqItem.qty,
          remaining_qty: remaining - reqItem.qty
        });
      }

      const delivery = await tx.deliveryOrder.create({
        data: {
          company_id: companyId,
          sales_order_id: salesOrderId,
          delivery_number: deliveryNumber,
          delivery_date: new Date(),
          status: 'WAITING',
          items: {
            create: deliveryItems
          }
        },
        include: { items: true }
      });

      return delivery;
    });
  }

  async validate(companyId: string, deliveryId: string) {
    return this.prisma.$transaction(async (tx) => {
      const delivery = await tx.deliveryOrder.findFirst({
        where: { id: deliveryId, company_id: companyId },
        include: { items: true, sales_order: { include: { items: true, deliveries: { include: { items: true } } } } }
      });
      if (!delivery) throw new NotFoundException('Delivery not found');
      if (delivery.status === 'DONE') throw new BadRequestException('Delivery already done');

      // Update Delivery
      await tx.deliveryOrder.update({
        where: { id: deliveryId },
        data: { status: 'DONE' }
      });

      const so = delivery.sales_order;

      // Deduct stock for each item
      // For simplicity, using first warehouse. Real ERP would select source warehouse.
      const warehouse = await tx.warehouse.findFirst({ where: { company_id: companyId } });
      if (!warehouse) throw new BadRequestException('No warehouse found for company');

      for (const item of delivery.items) {
        const stock = await tx.warehouseStock.findUnique({
          where: {
            company_id_warehouse_id_product_id: {
              company_id: companyId,
              warehouse_id: warehouse.id,
              product_id: item.product_id
            }
          }
        });

        if (stock) {
          await tx.warehouseStock.update({
            where: { id: stock.id },
            data: {
              current_stock: stock.current_stock - item.delivered_qty,
              available_stock: stock.available_stock - item.delivered_qty
            }
          });

          await tx.stockMovement.create({
            data: {
              company_id: companyId,
              warehouse_id: warehouse.id,
              product_id: item.product_id,
              transaction_type: 'DELIVERY',
              transaction_id: delivery.id,
              movement_type: 'OUT',
              qty_in: 0,
              qty_out: item.delivered_qty,
              balance_after: stock.current_stock - item.delivered_qty,
              created_by: 'SYSTEM',
            }
          });
        }
      }

      // Check SO delivery status
      const allDeliveries = await tx.deliveryOrder.findMany({
        where: { sales_order_id: so.id, status: 'DONE' },
        include: { items: true }
      });

      let allDelivered = true;
      let anyDelivered = false;

      for (const soItem of so.items) {
        let delivered = 0;
        allDeliveries.forEach(d => {
          const di = d.items.find(i => i.product_id === soItem.product_id);
          if (di) delivered += di.delivered_qty;
        });

        if (delivered > 0) anyDelivered = true;
        if (delivered < soItem.qty) allDelivered = false;
      }

      const newStatus = allDelivered ? 'DELIVERED' : (anyDelivered ? 'PARTIAL' : 'PENDING');
      
      await tx.salesOrder.update({
        where: { id: so.id },
        data: { delivery_status: newStatus }
      });

      return delivery;
    });
  }
}
