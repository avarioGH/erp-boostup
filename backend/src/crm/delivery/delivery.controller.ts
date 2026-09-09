import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('sales/deliveries')
export class DeliveryController {
  constructor(private service: DeliveryService, private prisma: PrismaService) {}
  @Permissions('delivery.create')
  @Post(':soId')
  create(@Request() req, @Param('soId') soId: string, @Body() data: any) { return this.service.create(req.user.company_id, soId, data); }
  @Permissions('delivery.view')
  @Get()
  async findAll(@Request() req) { 
    const data = await this.prisma.deliveryOrder.findMany({ where: { company_id: req.user.company_id }, include: { sales_order: true }, orderBy: { created_at: 'desc'} });
    return { data }; 
  }
  @Permissions('delivery.view')
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) { return this.prisma.deliveryOrder.findUnique({ where: { id, company_id: req.user.company_id }, include: { items: true, sales_order: true } }); }
  @Permissions('delivery.create')
  @Post(':id/validate')
  validate(@Request() req, @Param('id') id: string) { return this.service.validate(req.user.company_id, id); }
}
