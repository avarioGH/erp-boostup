import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';

@Controller('inventory/reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('inventory.view')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('movements')
  async getMovements(
    @Query('warehouseId') warehouseId?: string,
    @Query('variantId') variantId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('type') type?: string,
    @Query('referenceType') referenceType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getMovements({ warehouseId, variantId, dateFrom, dateTo, type, referenceType, page, limit });
  }

  @Get('stock-card')
  async getStockCard(
    @Query('warehouseId') warehouseId: string,
    @Query('variantId') variantId: string,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.reportsService.getStockCard(warehouseId, variantId, dateFrom, dateTo);
  }

  @Get('production-yield')
  async getProductionYield(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getProductionYield(dateFrom, dateTo);
  }

  @Get('operations-summary')
  async getOperationsSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getOperationsSummary(dateFrom, dateTo);
  }
}
