import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SawnTimberService } from './sawn-timber.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('inventory/sawn-timber')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SawnTimberController {
  constructor(private readonly sawnTimberService: SawnTimberService) {}

  @Get('outputs')
  @Permissions('read_inventory')
  async listOutputs(@Query() query: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.sawnTimberService.listOutputs({ ...query, companyId });
  }

  @Get('outputs/:id')
  @Permissions('read_inventory')
  async getOutput(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.sawnTimberService.getOutput(id, companyId);
  }

  @Post('outputs')
  @Permissions('write_inventory')
  async createOutput(@Body() data: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.sawnTimberService.createOutput({ ...data, companyId });
  }

  @Post('outputs/:id/post')
  @Permissions('write_inventory')
  async postOutput(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.sawnTimberService.postOutput(id, companyId);
  }

  @Post('outputs/:id/cancel')
  @Permissions('write_inventory')
  async cancelOutput(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.sawnTimberService.cancelOutput(id, companyId);
  }

  @Get('stock')
  @Permissions('read_inventory')
  async listStock(@Query() query: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.sawnTimberService.listStock({ ...query, companyId });
  }
}
