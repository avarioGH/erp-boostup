import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('sales')
  async getSalesAnalytics(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getSalesAnalytics(req.user.company_id, startDate, endDate);
  }

  @Get('customers')
  async getCustomerAnalytics(@Request() req: any) {
    return this.analyticsService.getCustomerAnalytics(req.user.company_id);
  }

  @Get('pipeline')
  async getPipelineAnalytics(@Request() req: any) {
    return this.analyticsService.getPipelineAnalytics(req.user.company_id);
  }

  @Get('financial')
  async getFinancialAnalytics(@Request() req: any) {
    return this.analyticsService.getFinancialAnalytics(req.user.company_id);
  }
}
