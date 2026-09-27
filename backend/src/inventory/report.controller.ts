import { Controller, Get, Query, Param, Request, BadRequestException } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('inventory/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  async getDashboardSummary(@Request() req: any) {
    return this.reportService.getDashboardSummary(req.user.companyId);
  }

  @Get('stock-summary')
  async getStockSummary(
    @Query('locationId') locationId?: string,
    @Query('productId') productId?: string,
    @Query('search') search?: string
  ) {
    return this.reportService.getStockSummary({ locationId, productId, search });
  }

  @Get('stock-card')
  async getStockCard(
    @Query('variantId') variantId: string,
    @Query('locationId') locationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('batch') batch?: string,
    @Request() req?: any
  ) {
    if (!variantId || !locationId) {
      throw new BadRequestException('variantId and locationId are required');
    }
    const sDate = startDate ? new Date(startDate) : undefined;
    const eDate = endDate ? new Date(endDate) : undefined;
    return this.reportService.getStockCard(req.user.companyId, variantId, locationId, batch, sDate, eDate);
  }

  @Get('yield')
  async getYieldReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('shift') shift?: string,
    @Request() req?: any
  ) {
    const sDate = startDate ? new Date(startDate) : undefined;
    const eDate = endDate ? new Date(endDate) : undefined;
    const companyId: string = req?.user?.companyId || '';
    return this.reportService.getYieldReport(companyId, { startDate: sDate, endDate: eDate, shift });
  }

  @Get('stock-aging')
  async getStockAgingReport() {
    return this.reportService.getStockAgingReport();
  }

  @Get('traceability')
  async getTraceabilityReport(@Query('search') search: string) {
    return this.reportService.getTraceabilityReport(search);
  }

  @Get('daily-monitoring')
  async getDailyMonitoring(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const sDate = startDate ? new Date(startDate) : undefined;
    const eDate = endDate ? new Date(endDate) : undefined;
    return this.reportService.getDailySawmillMonitoring({ startDate: sDate, endDate: eDate });
  }
}
