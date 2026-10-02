import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales/orders')
export class SalesOrderController {
  constructor(private prisma: PrismaService) {}

  @Permissions('quotation.view')
  @Get()
  async findAll(@Request() req) { 
    const compId = req.user.company_id || req.user.companyId;
    const data = await this.prisma.salesOrder.findMany({ 
      where: { company_id: compId }, 
      include: { 
        customer: true,
        allocations: true 
      }, 
      orderBy: { order_date: 'desc'} 
    });
    return { data }; 
  }

  @Permissions('quotation.create')
  @Post()
  async createOrder(@Request() req, @Body() body: any) {
    const compId = req.user.company_id || req.user.companyId;
    
    // Generate sequence
    const count = await this.prisma.salesOrder.count({ where: { company_id: compId } });
    const orderNo = `SO-${String(count + 1).padStart(5, '0')}`;

    const totalAmount = body.total_amount || body.items.reduce((sum: number, item: any) => sum + (item.qty * item.unit_price), 0);
    const paidAmount = body.paidAmount !== undefined ? body.paidAmount : 0;
    
    let paymentStatus = 'UNPAID';
    if (paidAmount >= totalAmount - 0.01) paymentStatus = 'PAID';
    else if (paidAmount > 0) paymentStatus = 'PARTIALLY_PAID';

    // Transaction
    const so = await this.prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.create({
        data: {
          company_id: compId,
          customer_id: body.customer_id,
          order_number: orderNo,
          order_date: new Date(body.order_date || new Date()),
          status: 'COMPLETED',
          total_amount: totalAmount,
          payment_status: paymentStatus,
          payment_method: body.payment_method || 'Transfer',
          notes: body.notes
        }
      });

      for (const item of body.items) {
        await tx.salesOrderItem.create({
          data: {
            sales_order_id: order.id,
            product_id: item.product_id,
            qty: Number(item.qty),
            unit_price: Number(item.unit_price),
            subtotal: Number(item.qty) * Number(item.unit_price)
          }
        });
      }

      if (paidAmount > 0) {
        // Create Payment and Allocation for CRM
        const cashAccount = await tx.cashAccount.findFirst({ where: { company_id: compId } });
        const payment = await tx.payment.create({
          data: {
            company_id: compId,
            customer_id: body.customer_id,
            payment_number: `PAY-${Date.now()}`,
            payment_date: new Date(),
            amount: paidAmount,
            payment_method: body.payment_method || 'Transfer',
            reference: orderNo,
            
          }
        });

        await tx.paymentAllocation.create({
          data: {
            payment_id: payment.id,
            sales_order_id: order.id,
            amount: paidAmount
          }
        });
        
        if (cashAccount) {
           await tx.financeTransaction.create({
            data: {
              company_id: compId,
              cash_account_id: cashAccount.id,
              transaction_no: `TRX-${Date.now()}`,
              transaction_type: 'Income',
              transaction_date: new Date(),
              total_amount: paidAmount,
              reference_type: 'SALES_ORDER',
              reference_id: order.id,
              description: `Pembayaran ${orderNo}`,
              status: 'COMPLETED',
              created_by: req.user.id,
            }
          });
        }
      }
      
      return order;
    });

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
          include: { payment: true }
        }
      } 
    }); 
  }
}
