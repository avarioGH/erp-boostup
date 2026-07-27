import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformService } from './platform.service';

@UseGuards(JwtAuthGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('settings')
  async getSettings(@Request() req) {
    return this.platformService.getSettings(req.user.company_id);
  }

  @Post('settings')
  async updateSettings(@Request() req, @Body() data: any) {
    return this.platformService.updateSettings(req.user.company_id, data);
  }

  @Get('api-keys')
  async getApiKeys(@Request() req) {
    return this.platformService.getApiKeys(req.user.company_id);
  }

  @Post('api-keys')
  async createApiKey(@Request() req, @Body() data: any) {
    return this.platformService.createApiKey(req.user.company_id, data);
  }

  @Post('ai/ask')
  async askAi(@Request() req, @Body() data: { prompt: string, contextData?: any }) {
    // Ideally use tenant_id from company, but here we can pass company_id as tenantId
    return this.platformService.generateAiInsight(data.prompt, data.contextData || {}, req.user.company_id);
  }

  @Get('audit-logs')
  async getAuditLogs(@Request() req) {
    return this.platformService.getAuditLogs(req.user.company_id);
  }
}
