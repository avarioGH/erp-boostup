import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales/orders')
export class SalesOrderController {
  constructor(private prisma: PrismaService) {}

  @Permissions('quotation.create')
  @Post()
  async create(@Request() req, @Body() data: any) {
    const total_amount = data.items.reduce((sum, i) => sum + (i.unit_price * i.qty), 0);
    return this.prisma.salesOrder.create({
      data: {
        company_id: req.user.company_id || req.user.companyId,
        customer_id: data.customer_id,
        order_number: `SO-${Date.now()}`,
        order_date: new Date(data.order_date),
        status: 'PENDING',
        total_amount: total_amount,
        notes: data.notes,
        payment_method: data.payment_method,
        payment_status: 'UNPAID',
        items: {
          create: data.items.map(item => ({
            product_id: item.product_id,
            qty: Number(item.qty),
            unit_price: Number(item.unit_price),
            subtotal: Number(item.qty) * Number(item.unit_price),
            system_qty: Number(item.qty)
          }))
        }
      }
    });
  }

  @Permissions('quotation.view')
  @Get()
  async findAll(@Request() req) { 
    const compId = req.user.company_id || req.user.companyId;
    const data = await this.prisma.salesOrder.findMany({ where: { company_id: compId }, include: { customer: true }, orderBy: { created_at: 'desc'} });
    return { data }; 
  }

  @Permissions('quotation.view')
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) { 
    const compId = req.user.company_id || req.user.companyId;
    return this.prisma.salesOrder.findUnique({ 
      where: { id, company_id: compId }, 
      include: { items: { include: { product: true } }, customer: true, deliveries: true, invoices: true } 
    }); 
  }
}
