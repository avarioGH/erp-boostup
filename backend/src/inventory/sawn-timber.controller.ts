import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SawnTimberService } from './sawn-timber.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('inventory/sawn-timber')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SawnTimberController {
  constructor(private readonly sawnTimberService: SawnTimberService) {}

  @Get('output')
  @Permissions('read_inventory')
  async listOutputs(@Query() query: any) {
    return this.sawnTimberService.listOutputs(query);
  }

  @Get('output/:id')
  @Permissions('read_inventory')
  async getOutput(@Param('id') id: string) {
    return this.sawnTimberService.getOutput(id);
  }

  @Post('output')
  @Permissions('write_inventory')
  async createOutput(@Body() data: any) {
    return this.sawnTimberService.createOutput(data);
  }

  @Post('output/:id/post')
  @Permissions('write_inventory')
  async postOutput(@Param('id') id: string) {
    return this.sawnTimberService.postOutput(id);
  }

  @Post('output/:id/cancel')
  @Permissions('write_inventory')
  async cancelOutput(@Param('id') id: string) {
    return this.sawnTimberService.cancelOutput(id);
  }

  @Get('stock')
  @Permissions('read_inventory')
  async listStock(@Query() query: any) {
    return this.sawnTimberService.listStock(query);
  }
}
