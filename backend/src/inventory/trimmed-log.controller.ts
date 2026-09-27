import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TrimmedLogService } from './trimmed-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('inventory/trimmed')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TrimmedLogController {
  constructor(private readonly trimService: TrimmedLogService) {}

  @Get()
  @Permissions('read_inventory')
  async listAll(@Query() query: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.trimService.listTrimmedLogs({ ...query, companyId });
  }

  @Get('by-raw/:id')
  @Permissions('read_inventory')
  async getChildren(@Param('id') rawLogId: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.trimService.getChildrenByRawLog(rawLogId, companyId);
  }

  @Post('by-raw/:id')
  @Permissions('write_inventory')
  async createChild(@Param('id') rawLogId: string, @Body() data: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.trimService.createTrimmedLog(rawLogId, { ...data, companyId });
  }

  @Get(':id')
  @Permissions('read_inventory')
  async getChild(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.trimService.getTrimmedLog(id, companyId);
  }

  @Post(':id/cancel')
  @Permissions('write_inventory')
  async cancelChild(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.trimService.cancelTrimmedLog(id, companyId);
  }
}
