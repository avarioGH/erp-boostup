import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { TimberSpeciesService } from '../services/timber-species.service';
import { CreateTimberSpeciesDto, UpdateTimberSpeciesDto } from '../dto/master-data.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/permissions.guard';
import { Permissions } from '../../../auth/permissions.decorator';

@Controller('inventory/master-data/timber-species')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimberSpeciesController {
  constructor(private readonly service: TimberSpeciesService) {}

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
  create(@Body() data: CreateTimberSpeciesDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @Permissions('inventory.update')
  update(@Param('id') id: string, @Body() data: Partial<UpdateTimberSpeciesDto>) {
    return this.service.update(id, data);
  }

  @Patch(':id/status')
  @Permissions('inventory.update')
  updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.service.updateStatus(id, isActive);
  }
}
