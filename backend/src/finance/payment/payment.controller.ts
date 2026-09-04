import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('finance/payments')
export class PaymentController {
  constructor(private service: PaymentService, private prisma: PrismaService) {}
  @Post()
  create(@Request() req, @Body() data: any) { return this.service.create(req.user.company_id, data.invoiceId, data); }
  @Get()
  async findAll(@Request() req) { 
    const data = await this.prisma.payment.findMany({ where: { company_id: req.user.company_id }, include: { invoice: true }, orderBy: { created_at: 'desc'} });
    return { data }; 
  }
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) { return this.prisma.payment.findUnique({ where: { id, company_id: req.user.company_id }, include: { invoice: true } }); }
}
