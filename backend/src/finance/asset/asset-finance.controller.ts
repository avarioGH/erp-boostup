import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { AssetService } from './asset.service';

@Controller('finance/asset')
export class AssetFinanceController {
  constructor(private readonly assetService: AssetService) {}

  @Get(':id/financials')
  getAssetFinancials(@Request() req: any, @Param('id') id: string) {
    return this.assetService.getAssetFinancials(req.user.company_id, id);
  }

  @Post(':id/capitalize')
  capitalizeAsset(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.assetService.capitalizeAsset(req.user.company_id, id, data);
  }

  @Post(':id/depreciate')
  postDepreciation(@Request() req: any, @Param('id') id: string, @Body('period') period: string) {
    return this.assetService.postDepreciation(req.user.company_id, id, period);
  }

  @Post(':id/dispose')
  disposeAsset(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.assetService.disposeAsset(req.user.company_id, id, data);
  }
}
