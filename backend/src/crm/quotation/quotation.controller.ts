import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { QuotationService } from './quotation.service';

@Controller('sales/quotations')
export class QuotationController {
  constructor(private service: QuotationService) {}
  @Post()
  create(@Request() req, @Body() data: any) { return this.service.create(req.user.company_id, data); }
  @Get()
  findAll(@Request() req, @Query('page') page: string, @Query('limit') limit: string) { return this.service.findAll(req.user.company_id, +page || 1, +limit || 10); }
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) { return this.service.findOne(req.user.company_id, id); }
  @Post(':id/confirm')
  confirm(@Request() req, @Param('id') id: string) { return this.service.confirm(req.user.company_id, id); }
}
