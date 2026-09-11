import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards } from '@nestjs/common';
import { RawLogService } from './raw-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('inventory/logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RawLogController {
  constructor(private readonly rawLogService: RawLogService) {}

  @Get()
  @Permissions('read_inventory')
  async list(@Query() query: any) {
    return this.rawLogService.listRawLogs(query);
  }

  @Get(':id')
  @Permissions('read_inventory')
  async get(@Param('id') id: string) {
    return this.rawLogService.getRawLog(id);
  }

  @Post()
  @Permissions('write_inventory')
  async create(@Body() data: any) {
    return this.rawLogService.createRawLog(data);
  }

  @Post(':id/cancel')
  @Permissions('write_inventory')
  async cancel(@Param('id') id: string) {
    return this.rawLogService.cancelRawLog(id);
  }
}
