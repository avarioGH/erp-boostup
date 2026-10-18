import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Headers,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { Permissions } from '../../auth/permissions.decorator';
import {
  BatchReclassificationService,
  EvaluateEligibilityDto,
  ExecuteReclassificationDto,
} from './batch-reclassification.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/reclassification')
export class BatchReclassificationController {
  constructor(
    private readonly reclassService: BatchReclassificationService,
  ) {}

  private getCompanyId(req: any): string {
    const companyId = req.user?.company_id || req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Authenticated company context is required');
    }
    return companyId;
  }

  @Permissions('inventory.reclassification.read')
  @Post('evaluate')
  evaluate(@Req() req, @Body() dto: EvaluateEligibilityDto) {
    const companyId = this.getCompanyId(req);
    return this.reclassService.evaluateEligibility(companyId, dto);
  }

  @Permissions('inventory.reclassification.execute')
  @Post('execute')
  execute(
    @Req() req,
    @Headers('idempotency-key') idempotencyKeyHeader: string,
    @Body() dto: ExecuteReclassificationDto,
  ) {
    const companyId = this.getCompanyId(req);
    const key = idempotencyKeyHeader || dto.idempotencyKey;
    if (!key) {
      throw new BadRequestException(
        'Idempotency-Key is mandatory either via header or body payload',
      );
    }
    return this.reclassService.executeReclassification(
      companyId,
      req.user?.id || req.user?.userId,
      { ...dto, idempotencyKey: key },
    );
  }

  @Permissions('inventory.reclassification.reverse')
  @Post(':id/reverse')
  reverse(
    @Param('id') id: string,
    @Req() req,
    @Body('reason') reason: string,
  ) {
    const companyId = this.getCompanyId(req);
    return this.reclassService.reverseReclassification(
      id,
      companyId,
      req.user?.id || req.user?.userId,
      reason,
    );
  }

  @Permissions('inventory.reclassification.read')
  @Get()
  list(
    @Req() req,
    @Query('warehouseId') warehouseId?: string,
    @Query('variantId') variantId?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    const companyId = this.getCompanyId(req);
    return this.reclassService.listReclassifications(companyId, {
      warehouseId,
      variantId,
      status,
      skip,
      take,
    });
  }
}
