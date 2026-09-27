import { Controller, Get, Post, Put, Delete, Body, Param, Query, Patch, UseGuards, Request } from '@nestjs/common';
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
  async list(@Query() query: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.rawLogService.listRawLogs({ ...query, companyId });
  }

  @Get(':id')
  @Permissions('read_inventory')
  async get(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.rawLogService.getRawLog(id, companyId);
  }

  @Post()
  @Permissions('write_inventory')
  async create(@Body() data: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.rawLogService.createRawLog({ ...data, companyId });
  }

  @Post(':id/cancel')
  @Permissions('write_inventory')
  async cancel(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.rawLogService.cancelRawLog(id, companyId);
  }

  @Post('bulk')
  @Permissions('write_inventory')
  async createBulk(@Body() data: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    if (!data || !Array.isArray(data.items)) {
      throw new Error('Invalid payload. Expected { items: [...] }');
    }
    const items = data.items.map((i: any) => ({ ...i, companyId }));
    return this.rawLogService.createBulkRawLogs(items);
  }

  @Put(':id')
  @Permissions('write_inventory')
  async update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.rawLogService.updateRawLog(id, { ...data, companyId });
  }

  @Delete(':id')
  @Permissions('write_inventory')
  async delete(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.rawLogService.deleteRawLog(id, companyId);
  }
}
