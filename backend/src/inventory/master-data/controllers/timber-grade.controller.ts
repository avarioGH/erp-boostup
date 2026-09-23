import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { TimberGradeService } from '../services/timber-grade.service';
import { CreateTimberGradeDto, UpdateTimberGradeDto } from '../dto/master-data.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/permissions.guard';
import { Permissions } from '../../../auth/permissions.decorator';

@Controller('inventory/master-data/timber-grade')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimberGradeController {
  constructor(private readonly service: TimberGradeService) {}

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
  create(@Body() data: CreateTimberGradeDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @Permissions('inventory.update')
  update(@Param('id') id: string, @Body() data: Partial<UpdateTimberGradeDto>) {
    return this.service.update(id, data);
  }

  @Patch(':id/status')
  @Permissions('inventory.update')
  updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.service.updateStatus(id, isActive);
  }
}
