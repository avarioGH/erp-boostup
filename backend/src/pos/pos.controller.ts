import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PosService } from './pos.service';

@UseGuards(JwtAuthGuard)
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('checkout')
  async checkout(@Request() req, @Body() data: any) {
    try {
      data.companyId = req.user.company_id || req.user.companyId;
      data.userId = req.user.userId || req.user.id;
      return await this.posService.processCheckout(data);
    } catch (error) {
      console.error('POS Checkout Error:', error);
      throw error;
    }
  }

  @Get('history')
  async getHistory(@Request() req) {
    return this.posService.getHistory(req.user.company_id);
  }

  @Get('shift')
  async getCurrentShift(@Request() req) {
    return this.posService.getCurrentShift(req.user.company_id, req.user.userId || req.user.id);
  }

  @Post('shift/open')
  async openShift(@Request() req, @Body() data: any) {
    data.companyId = req.user.company_id;
    data.userId = req.user.userId || req.user.id;
    return this.posService.openShift(data);
  }

  @Post('shift/close')
  async closeShift(@Request() req, @Body() data: any) {
    data.companyId = req.user.company_id;
    data.userId = req.user.userId || req.user.id;
    return this.posService.closeShift(data);
  }
}
