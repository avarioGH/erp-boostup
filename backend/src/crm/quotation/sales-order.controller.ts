import { PaymentService } from '../../finance/payment/payment.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales/orders')
export class SalesOrderController {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  @Permissions('quotation.view')
  @Get()
  async findAll(@Request() req) {
    const compId = req.user.company_id || req.user.companyId;
    const data = await this.prisma.salesOrder.findMany({
      where: { company_id: compId },
      include: {
        customer: true,
        allocations: true,
      },
      orderBy: [{ order_date: 'desc' }, { created_at: 'desc' }],
    });
    return { data };
  }

  @Permissions('quotation.create')
  @Post()
  async createOrder(@Request() req, @Body() body: any) {
    const compId = req.user.company_id || req.user.companyId;

    // Generate sequence
    const count = await this.prisma.salesOrder.count({
      where: { company_id: compId },
    });
    const orderNo = `SO-${String(count + 1).padStart(5, '0')}`;

    const totalAmount =
      body.total_amount ||
      body.items.reduce(
        (sum: number, item: any) => sum + item.qty * item.unit_price,
        0,
      );
    const paidAmount = body.paidAmount !== undefined ? body.paidAmount : 0;

    let paymentStatus = 'UNPAID';
    if (paidAmount >= totalAmount - 0.01) paymentStatus = 'PAID';
    else if (paidAmount > 0) paymentStatus = 'PARTIALLY_PAID';

    // Transaction
    const so = await this.prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.create({
        data: {
          company_id: compId,
          ecommerce_session_id:
            'MANUAL_' + Date.now() + Math.random().toString(36).substring(7),
          customer_id: body.customer_id,
          order_number: orderNo,
          order_date: new Date(body.order_date || new Date()),
          status: 'COMPLETED',
          total_amount: totalAmount,
          payment_status: paymentStatus,
          payment_method: body.payment_method || 'Transfer',
          notes: body.notes,
        },
      });

      for (const item of body.items) {
        await tx.salesOrderItem.create({
          data: {
            sales_order_id: order.id,
            product_id: item.product_id,
            qty: Number(item.qty),
            unit_price: Number(item.unit_price),
            subtotal: Number(item.qty) * Number(item.unit_price),
          },
        });
      }
      return order;
    }); // End of SO transaction

    // Delegate B2B Upfront Payment to Canonical PaymentService
    if (paidAmount > 0) {
      await this.paymentService.create(
        compId,
        {
          salesOrderId: so.id,
          customerId: body.customer_id,
          amount: paidAmount,
          paymentMethod: body.payment_method || 'Transfer',
          reference: orderNo,
          notes: `Upfront B2B Payment ${orderNo}`,
          allowUnallocated: true, // Allow just SO allocation
        },
        req.user.id,
      );
      // Refresh SO state to reflect updated payment status from PaymentService
      const refreshedSO = await this.prisma.salesOrder.findUnique({
        where: { id: so.id },
      });
      if (refreshedSO) so.payment_status = refreshedSO.payment_status;
    }

    return so;
  }

  @Permissions('quotation.view')
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    const compId = req.user.company_id || req.user.companyId;
    return this.prisma.salesOrder.findUnique({
      where: { id, company_id: compId },
      include: {
        items: { include: { product: true } },
        customer: true,
        allocations: {
          include: { payment: true },
        },
      },
    });
  }
}
