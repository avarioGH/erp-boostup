import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Get,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';

@Controller('inventory/timber-purchase')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchaseController {
  @Put(':id')
  @Permissions('inventory.create')
  async updatePurchase(@Param('id') id: string, @Body() data: any) {
    return this.purchaseService.updatePurchase(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.purchaseService.deletePurchase(id);
  }
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @Permissions('inventory.create')
  create(@Body() data: any, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.purchaseService.create(companyId, data);
  }

  @Post(':id/confirm')
  @Permissions('inventory.create')
  confirm(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.purchaseService.confirm(id, companyId);
  }

  @Post(':id/receive')
  @Permissions('inventory.create')
  receive(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.purchaseService.markAsReceived(id, companyId);
  }

  @Post(':id/cancel')
  @Permissions('inventory.create')
  cancel(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.purchaseService.cancel(id, companyId);
  }

  @Get()
  @Permissions('inventory.read')
  findAll(@Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.purchaseService.findAll(companyId);
  }

  @Get(':id')
  @Permissions('inventory.read')
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.purchaseService.findOne(id, companyId);
  }

  @Post(':id/log-items')
  @Permissions('inventory.create')
  addLogItem(@Param('id') id: string, @Body() data: any, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.purchaseService.addLogItem(id, companyId, data);
  }

  @Put(':id/log-items/:itemId')
  @Permissions('inventory.create')
  updateLogItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() data: any,
    @Request() req,
  ) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.purchaseService.updateLogItem(
      id,
      itemId,
      companyId,
      data,
    );
  }
}
