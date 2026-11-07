import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TaxService } from './tax.service';
import { TaxEngineService } from './tax-engine.service';
import type {
  CreateTaxProfileDto,
  CreateTaxRegulationDto,
  CreateTaxCodeDto,
  CreateTaxRuleDto,
  CreateTaxAccountMappingDto,
  UpdateProductTaxClassificationDto,
} from './tax.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tax')
export class TaxController {
  constructor(
    private readonly taxService: TaxService,
    private readonly taxEngineService: TaxEngineService,
  ) {}

  @Get('profile')
  async getTaxProfile(@Request() req: any) {
    return this.taxService.getActiveTaxProfile(req.user.company_id);
  }

  @Post('profile')
  async updateTaxProfile(@Request() req: any, @Body() dto: CreateTaxProfileDto) {
    dto.companyId = req.user.company_id;
    return this.taxService.upsertTaxProfile(dto, req.user.id || req.user.userId || 'SYSTEM');
  }

  @Get('regulations')
  async getRegulations(@Request() req: any) {
    return this.taxService.getRegulations(req.user.company_id);
  }

  @Post('regulations')
  async createRegulation(@Request() req: any, @Body() dto: CreateTaxRegulationDto) {
    dto.companyId = req.user.company_id;
    return this.taxService.createRegulation(dto, req.user.id || req.user.userId || 'SYSTEM');
  }

  @Get('codes')
  async getTaxCodes(@Request() req: any) {
    return this.taxService.getTaxCodes(req.user.company_id);
  }

  @Post('codes')
  async createTaxCode(@Request() req: any, @Body() dto: CreateTaxCodeDto) {
    dto.companyId = req.user.company_id;
    return this.taxService.createTaxCode(dto, req.user.id || req.user.userId || 'SYSTEM');
  }

  @Post('rules')
  async createTaxRule(@Request() req: any, @Body() dto: CreateTaxRuleDto) {
    dto.companyId = req.user.company_id;
    dto.userId = req.user.id || req.user.userId || 'SYSTEM';
    return this.taxService.createTaxRule(dto);
  }

  @Post('account-mappings')
  async upsertTaxAccountMapping(
    @Request() req: any,
    @Body() dto: CreateTaxAccountMappingDto,
  ) {
    dto.companyId = req.user.company_id;
    return this.taxService.upsertTaxAccountMapping(dto, req.user.id || req.user.userId || 'SYSTEM');
  }

  // Phase 2: Fish Product Classification endpoints
  @Get('fish-classifications')
  async getAllFishTaxClassifications(@Request() req: any) {
    return this.taxService.getAllFishTaxClassifications(req.user.company_id);
  }

  @Get('fish-classifications/:productId')
  async getProductTaxClassification(@Param('productId') productId: string) {
    return this.taxService.getProductTaxClassification(productId);
  }

  @Put('fish-classifications/:productId')
  async updateFishProductTaxClassification(
    @Request() req: any,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductTaxClassificationDto,
  ) {
    dto.companyId = req.user.company_id;
    dto.productId = productId;
    return this.taxService.updateFishProductTaxClassification(
      dto,
      req.user.id || req.user.userId || 'SYSTEM',
    );
  }

  // Seeding endpoint to initialize standard regulations and fish classification
  @Post('seed-standards')
  async seedStandardTaxRules(@Request() req: any) {
    return this.taxService.seedDefaultTaxRegulationsAndRules(
      req.user.company_id,
      req.user.id || req.user.userId || 'SYSTEM',
    );
  }

  // Interactive Tax Simulation / Calculation endpoint
  @Post('calculate')
  async calculateTaxes(
    @Request() req: any,
    @Body() body: { transactionType: any; items: any[]; asOfDate?: string },
  ) {
    return this.taxEngineService.calculateTransactionTaxes(
      req.user.company_id,
      body.transactionType || 'SALES_INVOICE',
      body.items || [],
      body.asOfDate ? new Date(body.asOfDate) : new Date(),
    );
  }

  // =========================================================================
  // PHASE 3: VAT ENGINE & FAKTUR PAJAK (NSFP) ENDPOINTS
  // =========================================================================

  @Get('invoices')
  async getTaxInvoices(
    @Request() req: any,
    @Query('type') type?: 'OUTPUT' | 'INPUT',
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.taxService.getTaxInvoices(
      req.user.company_id,
      type,
      year ? Number(year) : undefined,
      month ? Number(month) : undefined,
    );
  }

  @Post('invoices')
  async createTaxInvoice(@Request() req: any, @Body() dto: any) {
    dto.companyId = req.user.company_id;
    return this.taxService.createTaxInvoice(dto, req.user.id || req.user.userId || 'SYSTEM');
  }

  // =========================================================================
  // PHASE 4: WITHHOLDING TAX (PPh 21, 22, 23, 25, 4(2)) ENDPOINTS
  // =========================================================================

  @Get('withholding-certificates')
  async getWithholdingCertificates(
    @Request() req: any,
    @Query('taxType') taxType?: string,
    @Query('year') year?: string,
  ) {
    return this.taxService.getWithholdingCertificates(
      req.user.company_id,
      taxType,
      year ? Number(year) : undefined,
    );
  }

  @Post('withholding-certificates')
  async createWithholdingCertificate(@Request() req: any, @Body() dto: any) {
    dto.companyId = req.user.company_id;
    return this.taxService.createWithholdingCertificate(dto, req.user.id || req.user.userId || 'SYSTEM');
  }

  // =========================================================================
  // PHASE 5: CORPORATE TAX (KOREKSI FISKAL & PPH BADAN) ENDPOINTS
  // =========================================================================

  @Get('fiscal-adjustments')
  async getFiscalAdjustments(@Request() req: any, @Query('fiscalYear') fiscalYear: string) {
    return this.taxService.getFiscalAdjustments(
      req.user.company_id,
      fiscalYear ? Number(fiscalYear) : new Date().getFullYear(),
    );
  }

  @Post('fiscal-adjustments')
  async createFiscalAdjustment(@Request() req: any, @Body() dto: any) {
    dto.companyId = req.user.company_id;
    return this.taxService.createFiscalAdjustment(dto, req.user.id || req.user.userId || 'SYSTEM');
  }

  @Post('corporate-tax/calculate')
  async calculateCorporateTax(
    @Request() req: any,
    @Body() body: { fiscalYear: number; isEligiblePasal31e?: boolean },
  ) {
    return this.taxService.calculateAndSaveCorporateTax(
      req.user.company_id,
      body.fiscalYear || new Date().getFullYear(),
      body.isEligiblePasal31e ?? true,
    );
  }


  // =========================================================================
  // PHASE 8: CORETAX EXPORT & COMPLIANCE ENDPOINTS
  // =========================================================================

  @Get('coretax/ppn')
  async exportCoretaxPpn(
    @Request() req: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = month ? Number(month) : new Date().getMonth() + 1;
    const y = year ? Number(year) : new Date().getFullYear();
    return this.taxService.generateCoretaxPpnExport(req.user.company_id, m, y);
  }

  @Get('coretax/unifikasi')
  async exportCoretaxUnifikasi(
    @Request() req: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const m = month ? Number(month) : new Date().getMonth() + 1;
    const y = year ? Number(year) : new Date().getFullYear();
    return this.taxService.generateCoretaxUnifikasiExport(req.user.company_id, m, y);
  }

  @Get('compliance-status')
  async getComplianceStatus(@Request() req: any) {
    return this.taxService.getComplianceStatus(req.user.company_id);
  }
}
