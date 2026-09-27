import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { StockTransferService } from './stock-transfer.service';
import { StockAdjustmentService } from './stock-adjustment.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimberLedgerController {
  constructor(
    private readonly transferService: StockTransferService,
    private readonly adjustmentService: StockAdjustmentService,
    private readonly prisma: PrismaService
  ) {}

  @Get('timber-movements')
  @Permissions('read_inventory')
  async listMovements(@Query() query: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    const { skip = 0, take = 50, search, type, referenceType } = query;
    const where: any = { timberStock: { location: { company_id: companyId } } };
    if (type) where.type = type;
    if (referenceType) where.referenceType = referenceType;
    if (search) {
      where.referenceId = { contains: search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.timberStockMovement.findMany({
        skip: Number(skip), take: Number(take), where,
        orderBy: { createdAt: 'desc' },
        include: { timberStock: { include: { location: true, timberVariant: true } } }
      }),
      this.prisma.timberStockMovement.count({ where })
    ]);
    return { items, total, skip: Number(skip), take: Number(take) };
  }

  @Get('timber-stocks')
  @Permissions('read_inventory')
  async getTimberStocks(@Query() query: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    const { locationId, warehouseId, variantId, batch } = query;
    const where: any = { location: { company_id: companyId } };
    if (locationId) where.locationId = locationId;
    if (warehouseId) where.locationId = warehouseId; // Since locationId on TimberStock points to Warehouse
    if (variantId) where.timberVariantId = variantId;
    if (batch) where.batch = batch;
    
    // Always filter out empty stocks to keep payload small
    where.currentPcs = { gt: 0 };

    return this.prisma.timberStock.findMany({
      where,
      include: {
        location: true,
        timberVariant: true
      },
      orderBy: { batch: 'asc' }
    });
  }

  // --- TRANSFERS ---

  @Get('transfers')
  @Permissions('read_inventory')
  async listTransfers(@Query() query: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.transferService.listTransfers({ ...query, companyId });
  }

  @Get('transfers/:id')
  @Permissions('read_inventory')
  async getTransfer(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.transferService.getTransfer(id, companyId);
  }

  @Post('transfers')
  @Permissions('write_inventory')
  async createTransfer(@Body() data: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.transferService.createTransfer({ ...data, companyId });
  }

  @Post('transfers/:id/post')
  @Permissions('write_inventory')
  async postTransfer(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.transferService.postTransfer(id, companyId);
  }

  @Post('transfers/:id/cancel')
  @Permissions('write_inventory')
  async cancelTransfer(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.transferService.cancelTransfer(id, companyId);
  }

  // --- ADJUSTMENTS ---

  @Get('adjustments')
  @Permissions('read_inventory')
  async listAdjustments(@Query() query: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.adjustmentService.listAdjustments({ ...query, companyId });
  }

  @Get('adjustments/:id')
  @Permissions('read_inventory')
  async getAdjustment(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.adjustmentService.getAdjustment(id, companyId);
  }

  @Post('adjustments')
  @Permissions('write_inventory')
  async createAdjustment(@Body() data: any, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.adjustmentService.createAdjustment({ ...data, companyId });
  }

  @Post('adjustments/:id/post')
  @Permissions('write_inventory')
  async postAdjustment(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.adjustmentService.postAdjustment(id, companyId);
  }

  @Post('adjustments/:id/cancel')
  @Permissions('write_inventory')
  async cancelAdjustment(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.companyId || req.user.company_id;
    return this.adjustmentService.cancelAdjustment(id, companyId);
  }
}
