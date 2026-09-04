import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('finance/invoices')
export class InvoiceController {
  constructor(private service: InvoiceService, private prisma: PrismaService) {}
  @Post('from-so')
  create(@Request() req, @Body() data: { salesOrderId: string }) { return this.service.createFromSO(req.user.company_id, data.salesOrderId); }
  @Get()
  async findAll(@Request() req) { 
    const data = await this.prisma.invoice.findMany({ where: { company_id: req.user.company_id }, include: { customer: true }, orderBy: { created_at: 'desc'} });
    return { data }; 
  }
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) { return this.prisma.invoice.findUnique({ where: { id, company_id: req.user.company_id }, include: { items: true, customer: true, payments: true } }); }
  @Post(':id/post')
  post(@Request() req, @Param('id') id: string) { return this.service.post(req.user.company_id, id); }
}
