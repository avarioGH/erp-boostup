import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PackingService } from './packing.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';

@Controller('inventory/timber-packing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PackingController {
  constructor(private readonly packingService: PackingService) {}

  @Post()
  @Permissions('inventory.create')
  create(@Body() data: any, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.packingService.create(companyId, data);
  }

  @Get()
  @Permissions('inventory.read')
  findAll(@Request() req, @Query('partaiId') partaiId?: string) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.packingService.findAll(companyId, partaiId);
  }

  @Get(':id')
  @Permissions('inventory.read')
  findOne(@Param('id') id: string) {
    return this.packingService.findOne(id);
  }

  @Delete(':id')
  @Permissions('inventory.create')
  delete(@Param('id') id: string) {
    return this.packingService.delete(id);
  }
}
