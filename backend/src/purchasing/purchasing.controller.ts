import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('purchasing')
export class PurchasingController {
  constructor(private service: PurchasingService, private prisma: PrismaService) {}

  @Post('rfq')
  createRFQ(@Request() req, @Body() data: any) {
    return this.service.createRFQ(req.user.company_id, data);
  }

  @Post('rfq/:id/confirm')
  confirmRFQ(@Request() req, @Param('id') id: string) {
    return this.service.confirmRFQ(req.user.company_id, id);
  }

  @Get('orders')
  findOrders(@Request() req, @Query('page') page: string, @Query('limit') limit: string) {
    return this.service.findOrders(req.user.company_id, +page || 1, +limit || 10);
  }

  @Get('orders/:id')
  findOrder(@Request() req, @Param('id') id: string) {
    return this.service.findOrder(req.user.company_id, id);
  }

  @Post('orders/:id/receive')
  receiveGoods(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.service.receiveGoods(req.user.company_id, id, data);
  }

  @Get('receipts')
  async getReceipts(@Request() req) {
    const data = await this.prisma.goodsReceipt.findMany({
      where: { company_id: req.user.company_id },
      include: { supplier: true, purchase_order: true },
      orderBy: { created_at: 'desc' }
    });
    return { data };
  }

  @Get('receipts/:id')
  getReceipt(@Request() req, @Param('id') id: string) {
    return this.prisma.goodsReceipt.findUnique({
      where: { id, company_id: req.user.company_id },
      include: { items: { include: { product: true } }, supplier: true, purchase_order: true }
    });
  }
}
