import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ShopeeService } from './shopee.service';

@UseGuards(JwtAuthGuard)
@Controller('integrations/shopee')
export class ShopeeController {
  constructor(private readonly shopeeService: ShopeeService) {}

  @Get('status')
  async getStatus(@Request() req) {
    return this.shopeeService.getStatus(req.user.company_id);
  }

  @Post('save-credentials')
  async saveCredentials(@Request() req, @Body() body: { partnerId: string, partnerKey: string }) {
    return this.shopeeService.saveCredentials(req.user.company_id, body.partnerId, body.partnerKey);
  }

  @Post('auth-url')
  async getAuthUrl(@Request() req) {
    return this.shopeeService.generateAuthUrl(req.user.company_id);
  }

  // Placeholder for the callback that Shopee will redirect to
  // Usually this doesn't use JwtAuthGuard, but we'll mock it for now
  @Post('callback')
  async handleCallback(@Request() req, @Body() body: { code: string, shop_id: string }) {
    return this.shopeeService.exchangeToken(req.user.company_id, body.code, body.shop_id);
  }

  @Post('sync-orders')
  async syncOrders(@Request() req) {
    return this.shopeeService.syncOrders(req.user.company_id);
  }
}
