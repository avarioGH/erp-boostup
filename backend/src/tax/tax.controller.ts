import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
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
}
