import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { LocationService } from '../services/location.service';
import { CreateLocationDto, UpdateLocationDto } from '../dto/master-data.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/permissions.guard';
import { Permissions } from '../../../auth/permissions.decorator';

@Controller('inventory/master-data/location')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LocationController {
  constructor(private readonly service: LocationService) {}

  @Get()
  @Permissions('inventory.view')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions('inventory.view')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('inventory.create')
  create(@Body() data: CreateLocationDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @Permissions('inventory.update')
  update(@Param('id') id: string, @Body() data: Partial<UpdateLocationDto>) {
    return this.service.update(id, data);
  }

  @Patch(':id/status')
  @Permissions('inventory.update')
  updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.service.updateStatus(id, isActive);
  }
}
