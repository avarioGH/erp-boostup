import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  Put,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { OpnameService } from './opname.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/opname')
export class OpnameController {
  constructor(private readonly opnameService: OpnameService) {}

  private getCompanyId(req: any): string {
    const companyId = req.user?.company_id || req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Authenticated company context is required');
    }
    return companyId;
  }

  @Permissions('inventory.opname.create')
  @Post('draft/:warehouseId')
  createDraft(@Param('warehouseId') warehouseId: string, @Req() req) {
    const companyId = this.getCompanyId(req);
    return this.opnameService.createDraft(warehouseId, companyId, req.user?.id);
  }

  @Permissions('inventory.opname.update')
  @Put(':id/counts')
  updateCounts(
    @Param('id') id: string,
    @Req() req,
    @Body('items')
    items: {
      itemId: string;
      physicalQuantityPcs: number;
      physicalVolumeM3: number;
    }[],
  ) {
    const companyId = this.getCompanyId(req);
    return this.opnameService.updateCounts(id, companyId, items);
  }

  @Permissions('inventory.opname.confirm')
  @Post(':id/confirm')
  confirmOpname(@Param('id') id: string, @Req() req) {
    const companyId = this.getCompanyId(req);
    return this.opnameService.confirmOpname(id, companyId, req.user?.id);
  }

  @Permissions('inventory.opname.cancel')
  @Post(':id/cancel')
  cancelOpname(@Param('id') id: string, @Req() req) {
    const companyId = this.getCompanyId(req);
    return this.opnameService.cancelOpname(id, companyId);
  }

  @Permissions('inventory.opname.reconcile')
  @Get('reconcile')
  reconcile(@Req() req) {
    const companyId = this.getCompanyId(req);
    return this.opnameService.reconcile(companyId);
  }
}
