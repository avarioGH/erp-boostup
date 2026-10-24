import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  Res,
  Query,
} from '@nestjs/common';
import { PartaiService } from './partai.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import type { Response } from 'express';

@Controller('inventory/timber-partai')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PartaiController {
  constructor(private readonly partaiService: PartaiService) {}

  @Get(':id/export-excel')
  @Permissions('inventory.read')
  async exportExcel(
    @Param('id') id: string,
    @Query('sheets') sheets: string,
    @Query('species') species: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const companyId = req.user?.company_id || req.user?.companyId;
    const sheetArray = sheets ? sheets.split(',').map((s) => s.trim().toLowerCase()) : [];
    return this.partaiService.exportExcel(
      id,
      companyId,
      { sheets: sheetArray, species, startDate, endDate },
      res,
    );
  }

  @Post()
  @Permissions('inventory.create')
  create(@Body() data: any, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.partaiService.create(companyId, data);
  }

  @Get('migrate-testing')
  @Permissions('inventory.read')
  migrateTesting(@Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.partaiService.migrateToTesting(companyId);
  }

  @Get()
  @Permissions('inventory.read')
  findAll(@Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.partaiService.findAll(companyId);
  }

  @Get(':id')
  @Permissions('inventory.read')
  findOne(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.partaiService.findOne(id, companyId);
  }

  @Put(':id')
  @Permissions('inventory.create')
  update(@Param('id') id: string, @Body() data: any, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.partaiService.update(id, companyId, data);
  }

  @Delete(':id')
  @Permissions('inventory.create')
  delete(@Param('id') id: string, @Request() req) {
    const companyId = req.user?.company_id || req.user?.companyId;
    return this.partaiService.delete(id, companyId);
  }
}
