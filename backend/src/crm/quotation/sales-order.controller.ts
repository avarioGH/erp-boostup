import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('sales/orders')
export class SalesOrderController {
  constructor(private prisma: PrismaService) {}
  @Get()
  async findAll(@Request() req) { 
    const data = await this.prisma.salesOrder.findMany({ where: { company_id: req.user.company_id }, include: { customer: true }, orderBy: { created_at: 'desc'} });
    return { data }; 
  }
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) { 
    return this.prisma.salesOrder.findUnique({ 
      where: { id, company_id: req.user.company_id }, 
      include: { items: true, customer: true, deliveries: true, invoices: true } 
    }); 
  }
}
