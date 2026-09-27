import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { InputLogService } from './input-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('inventory/input-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InputLogController {
  constructor(private readonly inputLogService: InputLogService) {}

  @Get()
  @Permissions('read_inventory')
  async listAll(@Query() query: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.inputLogService.listInputLogs({ ...query, companyId });
  }

  @Get('available-trimmed')
  @Permissions('read_inventory')
  async getAvailableTrimmedLogs(@Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.inputLogService.getAvailableTrimmedLogs(companyId);
  }

  @Get(':id')
  @Permissions('read_inventory')
  async getOne(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.inputLogService.getInputLog(id, companyId);
  }

  @Post()
  @Permissions('write_inventory')
  async create(@Body() data: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.inputLogService.createInputLog({ ...data, companyId });
  }

  @Post(':id/cancel')
  @Permissions('write_inventory')
  async cancel(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.inputLogService.cancelInputLog(id, companyId);
  }
}
