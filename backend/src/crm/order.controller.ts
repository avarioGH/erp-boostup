import {
  Controller,
  Get, Query,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SalesCompletedEvent } from '../events/sales-completed.event';
import { InventoryService } from '../inventory/inventory.service';

@UseGuards(JwtAuthGuard)
@Controller('sales/orders')
export class OrderController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly inventoryService: InventoryService,
  ) {}

  @Get()
  async getOrders(@Request() req, @Query() query: any) {
    const whereParams: any = { company_id: req.user.company_id };
    if (query.warehouse_id) {
      whereParams.warehouse_id = query.warehouse_id;
    }
    const orders = await this.prisma.salesOrder.findMany({
      where: whereParams,
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { order_date: 'desc' },
    });
    return { data: orders };
  }

  @Post()
  async createOrder(@Request() req, @Body() data: any) {
    // Generate Order Number
    const orderCount = await this.prisma.salesOrder.count({
      where: { company_id: req.user.company_id },
    });
    const orderNumber = `SO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

    // Create the order transaction
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItems: any[] = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
        });
        if (!product) throw new Error(`Product ${item.product_id} not found`);

        const subtotal = Number(product.selling_price) * item.qty;
        totalAmount += subtotal;

        orderItems.push({
          product_id: product.id,
          qty: Number(item.qty),
          unit_price: product.selling_price,
          subtotal,
        });
      }

      const order = await tx.salesOrder.create({
        data: {
          company_id: req.user.company_id,
          customer_id: data.customer_id || data.partner_id,
          order_number: orderNumber,
          order_date: new Date(),
          status: 'COMPLETED',
          total_amount: totalAmount, ecommerce_session_id: 'MANUAL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          notes: data.notes,
          items: {
            create: orderItems,
          },
        },
      });

      // Integrate with Finance (Auto Cash In)
      // We need a Cash Account, let's just pick the first one or a default one
      const cashAccount = await tx.cashAccount.findFirst({
        where: { company_id: req.user.company_id },
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
            created_by: req.user.userId,
          },
        });

        // Update Cash Account Balance
        await this.eventEmitter.emitAsync(
          'sales.completed',
          new SalesCompletedEvent({
            companyId: req.user.company_id,
            sourceEntityId: order.id,
            payload: {
              totalAmount,
              paymentMethod: 'CASH',
              userId: req.user.userId,
            },
            occurredAt: new Date(),
            tx,
          }),
        );
      }

      // Integrate with Inventory (Reduce Stock)
      // JIKA PRE-ORDER: Stok TIDAK dikurangi sekarang, tunggu sampai stok di storage diisi/masuk
      const isPreorder = data.is_preorder === true || data.status === 'PREORDER';

      if (!isPreorder) {
        // Validasi ketersediaan stok di storage
        for (const item of data.items) {
          const product = await tx.product.findUnique({
            where: { id: item.product_id },
            include: { warehouse_stocks: true },
          });
          const availableStock = product?.warehouse_stocks?.reduce(
            (sum, ws) => sum + (Number(ws.current_stock) || 0),
            0,
          ) || 0;

          if (Number(item.qty) > availableStock) {
            throw new BadRequestException(
              `Stok "${product?.name || 'Produk'}" tidak mencukupi! Tersedia di storage: ${availableStock}, diminta: ${item.qty}. Silakan pilih mode Pre-Order jika ingin memesan terlebih dahulu.`,
            );
          }
        }

        const warehouse = await tx.warehouse.findFirst({
          where: { company_id: req.user.company_id },
        });

        if (warehouse) {
          for (const item of orderItems) {
            await this.inventoryService.issueStock(tx as any, {
              companyId: req.user.company_id,
              warehouseId: warehouse.id,
              productId: item.product_id,
              quantity: Number(item.qty),
              referenceType: 'SALE',
              referenceId: order.id,
              description: `Sales Order ${order.order_number}`,
              userId: req.user.userId,
              allowNegative: false,
            });
          }
        }
      } else {
        // Update status SO menjadi PREORDER
        await tx.salesOrder.update({
          where: { id: order.id },
          data: {
            status: 'PREORDER',
            delivery_status: 'PENDING',
          },
        });
        order.status = 'PREORDER';
      }

      return order;
    });
  }

  @Post(':id/fulfill')
  async fulfillPreorder(@Request() req, @Param('id') id: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findFirst({
        where: { id, company_id: req.user.company_id },
        include: {
          items: {
            include: {
              product: {
                include: { warehouse_stocks: true },
              },
            },
          },
        },
      });

      if (!order) throw new BadRequestException('Sales order tidak ditemukan');
      if (order.status !== 'PREORDER') {
        throw new BadRequestException('Hanya order berstatus Pre-Order yang dapat diproses kirim');
      }

      // Periksa apakah stok inventori sekarang sudah tersedia
      for (const item of order.items) {
        const availableStock = item.product?.warehouse_stocks?.reduce(
          (sum, ws) => sum + (Number(ws.current_stock) || 0),
          0,
        ) || 0;

        if (Number(item.qty) > availableStock) {
          throw new BadRequestException(
            `Stok "${item.product?.name}" belum cukup untuk dikirim! Saat ini tersedia: ${availableStock}, dibutuhkan: ${item.qty}. Silakan isi/tambah stok di inventori terlebih dahulu.`,
          );
        }
      }

      // Potong stok inventori
      const warehouse = await tx.warehouse.findFirst({
        where: { company_id: req.user.company_id },
      });
      if (!warehouse) throw new BadRequestException('Gudang tidak ditemukan');

      for (const item of order.items) {
        await this.inventoryService.issueStock(tx as any, {
          companyId: req.user.company_id,
          warehouseId: warehouse.id,
          productId: item.product_id,
          quantity: Number(item.qty),
          referenceType: 'SALE',
          referenceId: order.id,
          description: `Pengiriman Pre-Order ${order.order_number}`,
          userId: req.user.userId,
          allowNegative: false,
        });
      }

      const updated = await tx.salesOrder.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          delivery_status: 'DELIVERED',
        },
      });

      return updated;
    });
  }
}
