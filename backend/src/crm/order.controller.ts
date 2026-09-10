import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SalesCompletedEvent } from '../events/sales-completed.event';
import { InventoryService } from '../inventory/inventory.service';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2, private readonly inventoryService: InventoryService) {}

  @Get()
  async getOrders(@Request() req) {
    return this.prisma.salesOrder.findMany({
      where: { company_id: req.user.company_id },
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { order_date: 'desc' }
    });
  }

  @Post()
  async createOrder(@Request() req, @Body() data: any) {
    // Generate Order Number
    const orderCount = await this.prisma.salesOrder.count({ where: { company_id: req.user.company_id }});
    const orderNumber = `SO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

    // Create the order transaction
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItems: any[] = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.product_id } });
        if (!product) throw new Error(`Product ${item.product_id} not found`);
        
        const subtotal = Number(product.selling_price) * item.qty;
        totalAmount += subtotal;

        orderItems.push({
          product_id: product.id,
          qty: item.qty,
          unit_price: product.selling_price,
          subtotal
        });
      }

      const order = await tx.salesOrder.create({
        data: {
          company_id: req.user.company_id,
          customer_id: data.customer_id,
          order_number: orderNumber,
          order_date: new Date(),
          status: 'COMPLETED',
          total_amount: totalAmount,
          notes: data.notes,
          items: {
            create: orderItems
          }
        }
      });

      // Integrate with Finance (Auto Cash In)
      // We need a Cash Account, let's just pick the first one or a default one
      const cashAccount = await tx.cashAccount.findFirst({
        where: { company_id: req.user.company_id }
      });

      if (cashAccount) {
        await tx.financeTransaction.create({
          data: {
            company_id: req.user.company_id,
            transaction_no: `FIN-${orderNumber}`,
            transaction_type: 'Income',
            cash_account_id: cashAccount.id,
            transaction_date: new Date(),
            status: 'COMPLETED',
            description: `Payment for Order ${orderNumber}`,
            total_amount: totalAmount,
            created_by: req.user.userId
          }
        });
        
        // Update Cash Account Balance
        await this.eventEmitter.emitAsync('sales.completed', new SalesCompletedEvent({ companyId: req.user.company_id, sourceEntityId: order.id, payload: { totalAmount, paymentMethod: 'CASH', userId: req.user.userId }, occurredAt: new Date(), tx }));
      }

      // Integrate with Inventory (Reduce Stock)
      const warehouse = await tx.warehouse.findFirst({
        where: { company_id: req.user.company_id }
      });

      if (warehouse) {
        for (const item of orderItems) {
          await this.inventoryService.issueStock(tx as any, {
            companyId: req.user.company_id,
            warehouseId: warehouse.id,
            productId: item.product_id,
            quantity: item.qty,
            referenceType: 'SALE',
            referenceId: order.id,
            description: `Sales Order ${order.order_number}`,
            userId: req.user.userId,
            allowNegative: true // to preserve previous best-effort behavior
          });
        }
      }

      return order;
    });
  }
}
