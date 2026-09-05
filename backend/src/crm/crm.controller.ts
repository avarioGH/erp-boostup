import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CrmService } from './crm.service';

@UseGuards(JwtAuthGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('leads')
  async getLeads(@Request() req: any) {
    return this.crmService.getLeads(req.user.company_id);
  }

  @Post('leads')
  async createLead(@Request() req: any, @Body() data: any) {
    return this.crmService.createLead(req.user.company_id, data);
  }

  @Get('leads/:id')
  async getLead(@Request() req: any, @Param('id') id: string) {
    return this.crmService.getLead(req.user.company_id, id);
  }

  @Patch('leads/:id')
  async updateLead(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.crmService.updateLead(req.user.company_id, id, data);
  }

  @Post('leads/:id/convert')
  async convertLead(@Request() req: any, @Param('id') id: string) {
    return this.crmService.convertLead(req.user.company_id, id);
  }

  @Get('opportunities')
  async getOpportunities(@Request() req: any) {
    return this.crmService.getOpportunities(req.user.company_id);
  }

  @Post('opportunities')
  async createOpportunity(@Request() req: any, @Body() data: any) {
    return this.crmService.createOpportunity(req.user.company_id, data);
  }

  @Get('opportunities/:id')
  async getOpportunity(@Request() req: any, @Param('id') id: string) {
    return this.crmService.getOpportunity(req.user.company_id, id);
  }

  @Patch('opportunities/:id')
  async updateOpportunity(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.crmService.updateOpportunity(req.user.company_id, id, data);
  }

  @Get('activities')
  async getActivities(@Request() req: any) {
    return this.crmService.getActivities(req.user.company_id);
  }

  @Post('activities')
  async createActivity(@Request() req: any, @Body() data: any) {
    return this.crmService.createActivity(req.user.company_id, data);
  }

  @Patch('activities/:id')
  async updateActivity(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.crmService.updateActivity(req.user.company_id, id, data);
  }

  @Get('customers/:id/360')
  async getCustomer360(@Request() req: any, @Param('id') id: string) {
    return this.crmService.getCustomer360(req.user.company_id, id);
  }
}
