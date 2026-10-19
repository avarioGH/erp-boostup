import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Get,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';

@Controller('inventory/timber-shipment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  @Permissions('inventory.create')
  create(@Body() data: any, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.shipmentService.create(companyId, data);
  }

  @Post(':id/confirm')
  @Permissions('inventory.create')
  confirm(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.shipmentService.confirm(id, companyId);
  }

  @Post(':id/cancel')
  @Permissions('inventory.create')
  cancel(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.shipmentService.cancel(id, companyId);
  }

  @Get()
  @Permissions('inventory.read')
  findAll(@Request() req, @Query('partaiId') partaiId?: string) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.shipmentService.findAll(companyId, partaiId);
  }

  @Get(':id')
  @Permissions('inventory.read')
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.shipmentService.findOne(id, companyId);
  }

  @Delete(':id')
  @Permissions('inventory.create')
  delete(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.shipmentService.delete(id, companyId);
  }

  @Put(':id')
  @Permissions('inventory.create')
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.shipmentService.update(id, companyId, data);
  }
}
