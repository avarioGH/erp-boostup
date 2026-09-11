import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('finance/invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvoiceController {
  constructor(private service: InvoiceService, private prisma: PrismaService) {}
  @Permissions('invoice.create')
  @Post('from-so')
  create(@Request() req, @Body() data: { salesOrderId: string }) { return this.service.createFromSO(req.user.company_id, data.salesOrderId); }
  @Permissions('invoice.view')
  @Get()
  async findAll(@Request() req, @Query('type') type?: string) { 
    const where: any = { company_id: req.user.company_id };
    if (type) where.type = type;
    const data = await this.prisma.invoice.findMany({ 
      where, 
      include: { customer: true, supplier: true }, 
      orderBy: { created_at: 'desc'} 
    });
    return { data }; 
  }
  @Permissions('invoice.view')
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) { return this.prisma.invoice.findUnique({ where: { id, company_id: req.user.company_id }, include: { items: true, customer: true, payments: true } }); }
  @Permissions('invoice.create')
  @Post(':id/post')
  post(@Request() req, @Param('id') id: string) { return this.service.post(req.user.company_id, id); }
}

