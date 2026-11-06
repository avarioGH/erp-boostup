import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTaxProfileDto,
  CreateTaxRegulationDto,
  CreateTaxCodeDto,
  CreateTaxRuleDto,
  CreateTaxAccountMappingDto,
  UpdateProductTaxClassificationDto,
} from './tax.dto';

@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);

  constructor(private prisma: PrismaService) {}

  // =========================================================================
  // 1. TAX PROFILE (PKP vs Non-PKP Management)
  // =========================================================================

  async getActiveTaxProfile(companyId: string, asOfDate: Date = new Date()) {
    const profile = await this.prisma.taxProfile.findFirst({
      where: {
        company_id: companyId,
        status: 'ACTIVE',
        effective_from: { lte: asOfDate },
        OR: [
          { effective_to: null },
          { effective_to: { gte: asOfDate } },
        ],
      },
      orderBy: { effective_from: 'desc' },
    });
    return profile;
  }

  async upsertTaxProfile(dto: CreateTaxProfileDto, userId: string) {
    const cleanNpwp = dto.npwp.replace(/[^0-9]/g, '');
    if (cleanNpwp.length !== 15 && cleanNpwp.length !== 16) {
      throw new BadRequestException('NPWP harus 15 atau 16 digit angka.');
    }

    const existing = await this.getActiveTaxProfile(dto.companyId);

    const profile = await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.taxProfile.update({
          where: { id: existing.id },
          data: { status: 'INACTIVE', effective_to: new Date() },
        });
      }

      const created = await tx.taxProfile.create({
        data: {
          company_id: dto.companyId,
          npwp: cleanNpwp,
          nitku: dto.nitku || null,
          taxpayer_name: dto.taxpayerName,
          tax_office_code: dto.taxOfficeCode || null,
          klu_code: dto.kluCode || '03111', // Default Perikanan Tangkap Laut
          is_pkp: dto.isPkp ?? false,
          pkp_number: dto.pkpNumber || null,
          pkp_date: dto.pkpDate ? new Date(dto.pkpDate) : null,
          signer_name: dto.signerName || null,
          signer_position: dto.signerPosition || null,
          certificate_expiry: dto.certificateExpiry ? new Date(dto.certificateExpiry) : null,
          effective_from: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
          effective_to: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
          status: 'ACTIVE',
        },
      });

      await tx.taxAuditLog.create({
        data: {
          company_id: dto.companyId,
          entity_type: 'TAX_PROFILE',
          entity_id: created.id,
          action: existing ? 'UPDATE' : 'CREATE',
          performed_by: userId,
          previous_state: existing ? JSON.stringify(existing) : null,
          new_state: JSON.stringify(created),
          regulatory_evidence: 'Pembaruan Profil Perpajakan Perusahaan',
        },
      });

      return created;
    });

    return profile;
  }

  // =========================================================================
  // 2. TAX REGULATIONS
  // =========================================================================

  async getRegulations(companyId: string) {
    return this.prisma.taxRegulation.findMany({
      where: { company_id: companyId },
      include: { rules: { include: { tax_code: true } } },
      orderBy: { effective_from: 'desc' },
    });
  }

  async createRegulation(dto: CreateTaxRegulationDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reg = await tx.taxRegulation.create({
        data: {
          company_id: dto.companyId,
          regulation_number: dto.regulationNumber,
          title: dto.title,
          law_type: dto.lawType,
          category: dto.category,
          description: dto.description || null,
          source_document_url: dto.sourceDocumentUrl || null,
          effective_from: new Date(dto.effectiveFrom),
          effective_to: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
          status: 'ACTIVE',
        },
      });

      await tx.taxAuditLog.create({
        data: {
          company_id: dto.companyId,
          entity_type: 'TAX_REGULATION',
          entity_id: reg.id,
          action: 'CREATE',
          performed_by: userId,
          new_state: JSON.stringify(reg),
          regulatory_evidence: dto.regulationNumber,
        },
      });

      return reg;
    });
  }

  // =========================================================================
  // 3. TAX CODES & RULES (Effective-Dated, Never Hardcoded)
  // =========================================================================

  async getTaxCodes(companyId: string) {
    return this.prisma.taxCode.findMany({
      where: { company_id: companyId },
      include: {
        rules: {
          where: { status: 'ACTIVE' },
          include: { regulation: true, versions: { orderBy: { version_number: 'desc' } } },
        },
        accountMappings: {
          include: { debit_account: true, credit_account: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async createTaxCode(dto: CreateTaxCodeDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const taxCode = await tx.taxCode.create({
        data: {
          company_id: dto.companyId,
          code: dto.code.toUpperCase().trim(),
          name: dto.name,
          tax_type: dto.taxType,
          description: dto.description || null,
          is_active: true,
        },
      });

      await tx.taxAuditLog.create({
        data: {
          company_id: dto.companyId,
          entity_type: 'TAX_CODE',
          entity_id: taxCode.id,
          action: 'CREATE',
          performed_by: userId,
          new_state: JSON.stringify(taxCode),
        },
      });

      return taxCode;
    });
  }

  async createTaxRule(dto: CreateTaxRuleDto) {
    const userId = dto.userId || 'SYSTEM';
    return this.prisma.$transaction(async (tx) => {
      const rule = await tx.taxRule.create({
        data: {
          regulation_id: dto.regulationId,
          tax_code_id: dto.taxCodeId,
          tax_treatment: dto.taxTreatment,
          calculation_method: dto.calculationMethod,
          tariff_rate: dto.tariffRate,
          dpp_factor: dto.dppFactor ?? 1.0,
          minimum_threshold: dto.minimumThreshold ?? 0,
          is_creditable: dto.isCreditable ?? true,
          requires_npwp: dto.requiresNpwp ?? true,
          non_npwp_penalty_rate: dto.nonNpwpPenaltyRate ?? 0,
          effective_from: new Date(dto.effectiveFrom),
          effective_to: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
          status: 'ACTIVE',
        },
      });

      // Create Initial Version (Version 1)
      await tx.taxRuleVersion.create({
        data: {
          rule_id: rule.id,
          version_number: 1,
          change_reason: dto.reason || 'Initial creation of tax rule',
          tariff_rate_snapshot: rule.tariff_rate,
          dpp_factor_snapshot: rule.dpp_factor,
          formula_payload: JSON.stringify({
            calculationMethod: rule.calculation_method,
            taxTreatment: rule.tax_treatment,
            tariffRate: rule.tariff_rate,
            dppFactor: rule.dpp_factor,
          }),
          effective_from: rule.effective_from,
          effective_to: rule.effective_to,
          approved_by: userId,
        },
      });

      await tx.taxAuditLog.create({
        data: {
          company_id: dto.companyId,
          entity_type: 'TAX_RULE',
          entity_id: rule.id,
          action: 'CREATE',
          performed_by: userId,
          new_state: JSON.stringify(rule),
          regulatory_evidence: dto.reason || 'Tax Rule Established',
        },
      });

      return rule;
    });
  }

  // =========================================================================
  // 4. TAX ACCOUNT MAPPING (GL Linkage)
  // =========================================================================

  async upsertTaxAccountMapping(dto: CreateTaxAccountMappingDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const mapping = await tx.taxAccountMapping.upsert({
        where: {
          company_id_tax_code_id_transaction_type: {
            company_id: dto.companyId,
            tax_code_id: dto.taxCodeId,
            transaction_type: dto.transactionType,
          },
        },
        update: {
          debit_account_id: dto.debitAccountId,
          credit_account_id: dto.creditAccountId,
          status: 'ACTIVE',
        },
        create: {
          company_id: dto.companyId,
          tax_code_id: dto.taxCodeId,
          transaction_type: dto.transactionType,
          debit_account_id: dto.debitAccountId,
          credit_account_id: dto.creditAccountId,
          status: 'ACTIVE',
        },
      });

      await tx.taxAuditLog.create({
        data: {
          company_id: dto.companyId,
          entity_type: 'TAX_ACCOUNT_MAPPING',
          entity_id: mapping.id,
          action: 'UPDATE',
          performed_by: userId,
          new_state: JSON.stringify(mapping),
        },
      });

      return mapping;
    });
  }

  // =========================================================================
  // 5. PHASE 2: FISH PRODUCT TAX CLASSIFICATION
  // =========================================================================

  async getProductTaxClassification(productId: string) {
    return this.prisma.productTaxClassification.findUnique({
      where: { product_id: productId },
      include: { tax_code: { include: { rules: { where: { status: 'ACTIVE' } } } } },
    });
  }

  async getAllFishTaxClassifications(companyId: string) {
    return this.prisma.productTaxClassification.findMany({
      where: { company_id: companyId },
      include: {
        product: { select: { id: true, code: true, name: true, purchase_price: true, selling_price: true } },
        tax_code: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateFishProductTaxClassification(
    dto: UpdateProductTaxClassificationDto,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.productTaxClassification.findUnique({
        where: { product_id: dto.productId },
      });

      const classification = await tx.productTaxClassification.upsert({
        where: { product_id: dto.productId },
        update: {
          fish_species_category: dto.fishSpeciesCategory,
          scientific_name: dto.scientificName || null,
          product_condition: dto.productCondition,
          cutting_form: dto.cuttingForm,
          origin_type: dto.originType,
          hs_code: dto.hsCode || null,
          vat_classification: dto.vatClassification,
          tax_facility: dto.taxFacility || 'NONE',
          legal_reference: dto.legalReference,
          tax_code_id: dto.taxCodeId || null,
          review_status: dto.reviewStatus || (existing ? existing.review_status : 'PENDING_REVIEW'),
          reviewed_by: dto.reviewedBy || null,
          reviewed_at: dto.reviewStatus === 'VERIFIED' ? new Date() : null,
          review_notes: dto.reviewNotes || null,
          regulatory_evidence: dto.regulatoryEvidence || null,
          effective_from: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
          effective_to: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        },
        create: {
          company_id: dto.companyId,
          product_id: dto.productId,
          fish_species_category: dto.fishSpeciesCategory,
          scientific_name: dto.scientificName || null,
          product_condition: dto.productCondition,
          cutting_form: dto.cuttingForm,
          origin_type: dto.originType,
          hs_code: dto.hsCode || null,
          vat_classification: dto.vatClassification,
          tax_facility: dto.taxFacility || 'NONE',
          legal_reference: dto.legalReference,
          tax_code_id: dto.taxCodeId || null,
          review_status: dto.reviewStatus || 'PENDING_REVIEW',
          reviewed_by: dto.reviewedBy || null,
          reviewed_at: dto.reviewStatus === 'VERIFIED' ? new Date() : null,
          review_notes: dto.reviewNotes || null,
          regulatory_evidence: dto.regulatoryEvidence || null,
          effective_from: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
          effective_to: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        },
      });

      await tx.taxAuditLog.create({
        data: {
          company_id: dto.companyId,
          entity_type: 'TAX_CLASSIFICATION',
          entity_id: classification.id,
          action: existing ? 'UPDATE' : 'CREATE',
          performed_by: userId,
          previous_state: existing ? JSON.stringify(existing) : null,
          new_state: JSON.stringify(classification),
          regulatory_evidence: dto.regulatoryEvidence || dto.legalReference,
        },
      });

      return classification;
    });
  }

  // =========================================================================
  // 6. SEEDING STANDARD INDONESIA TAX REGULATIONS 2026 FOR FISH ERP
  // =========================================================================

  async seedDefaultTaxRegulationsAndRules(companyId: string, userId: string = 'SYSTEM') {
    this.logger.log(`Seeding Indonesian 2026 Tax Regulations and Rules for company: ${companyId}`);
    try {
      return await this.prisma.$transaction(async (tx) => {
      // 1. Ensure Standard COA Accounts exist for Tax
      const findOrCreateAccount = async (code: string, name: string, typeName: string, normalBalance: string) => {
        let acc = await tx.chartOfAccount.findUnique({
          where: { company_id_account_code: { company_id: companyId, account_code: code } },
        });
        if (!acc) {
          let accType = await tx.accountType.findFirst({
            where: { company_id: companyId, name: typeName },
          });
          if (!accType) {
            accType = await tx.accountType.create({
              data: {
                company_id: companyId,
                code: typeName.toUpperCase().slice(0, 4),
                name: typeName,
                normal_balance: normalBalance,
              },
            });
          }
          acc = await tx.chartOfAccount.create({
            data: {
              company_id: companyId,
              account_code: code,
              account_name: name,
              account_type_id: accType.id,
              status: true,
            },
          });
        }
        return acc;
      };

      const accPpnKeluaran = await findOrCreateAccount('2-1301', 'Hutang PPN Keluaran', 'Liability', 'Credit');
      const accPpnMasukan = await findOrCreateAccount('1-1401', 'PPN Masukan Dapat Dikreditkan', 'Asset', 'Debit');
      const accPpnMasukanNonCred = await findOrCreateAccount('6-1402', 'Beban PPN Masukan Tidak Dapat Dikreditkan', 'Expense', 'Debit');
      const accPph21 = await findOrCreateAccount('2-1302', 'Hutang PPh 21 Karyawan', 'Liability', 'Credit');
      const accPph22 = await findOrCreateAccount('2-1303', 'Hutang PPh 22 Pembelian Perikanan', 'Liability', 'Credit');
      const accPph23 = await findOrCreateAccount('2-1304', 'Hutang PPh 23 Jasa/Sewa', 'Liability', 'Credit');
      const accPph42 = await findOrCreateAccount('2-1305', 'Hutang PPh Final 4(2)', 'Liability', 'Credit');
      const accPphFinalUmkm = await findOrCreateAccount('6-1901', 'Beban PPh Final PP 55 (0.5%)', 'Expense', 'Debit');
      const accHutangPphFinal = await findOrCreateAccount('2-1306', 'Hutang PPh Final UMKM', 'Liability', 'Credit');

      // 2. Seed Regulations
      const regPP49 = await tx.taxRegulation.upsert({
        where: { company_id_regulation_number: { company_id: companyId, regulation_number: 'PP-49/2022' } },
        update: {},
        create: {
          company_id: companyId,
          regulation_number: 'PP-49/2022',
          title: 'PP No. 49 Tahun 2022 — PPN Dibebaskan atas Barang Kebutuhan Pokok dan Hasil Perikanan Segar/Dingin/Beku Tertentu',
          law_type: 'PP',
          category: 'VAT',
          description: 'Fasilitas PPN Dibebaskan untuk komoditas hasil perikanan yang diambil langsung dari sumbernya dan belum diolah lebih lanjut.',
          effective_from: new Date('2022-12-12'),
          status: 'ACTIVE',
        },
      });

      const regPMK131 = await tx.taxRegulation.upsert({
        where: { company_id_regulation_number: { company_id: companyId, regulation_number: 'PMK-131/2024' } },
        update: {},
        create: {
          company_id: companyId,
          regulation_number: 'PMK-131/2024',
          title: 'PMK No. 131 Tahun 2024 — Pedoman Pelaksanaan PPN dan Tata Cara Pemungutan PPN Barang dan Jasa Kena Pajak',
          law_type: 'PMK',
          category: 'VAT',
          description: 'Regulasi pelaksanaan tarif PPN standar dan penyesuaian Faktur Pajak.',
          effective_from: new Date('2024-10-01'),
          status: 'ACTIVE',
        },
      });

      const regPP55 = await tx.taxRegulation.upsert({
        where: { company_id_regulation_number: { company_id: companyId, regulation_number: 'PP-55/2022' } },
        update: {},
        create: {
          company_id: companyId,
          regulation_number: 'PP-55/2022',
          title: 'PP No. 55 Tahun 2022 — Penyesuaian Pengaturan di Bidang Pajak Penghasilan (PPh Final UMKM 0.5%)',
          law_type: 'PP',
          category: 'PPH_FINAL',
          description: 'Pajak Penghasilan Final 0.5% atas peredaran bruto tertentu untuk Wajib Pajak Badan / Orang Pribadi.',
          effective_from: new Date('2022-12-20'),
          status: 'ACTIVE',
        },
      });

      const regPMK168 = await tx.taxRegulation.upsert({
        where: { company_id_regulation_number: { company_id: companyId, regulation_number: 'PMK-168/2023' } },
        update: {},
        create: {
          company_id: companyId,
          regulation_number: 'PMK-168/2023',
          title: 'PMK No. 168 Tahun 2023 — Petunjuk Pemotongan PPh 21 Menggunakan Tarif Efektif Rata-Rata (TER)',
          law_type: 'PMK',
          category: 'PPH_21',
          description: 'Penerapan Skema Tarif Efektif Rata-Rata (TER) Bulanan Kategori A, B, dan C untuk PPh 21 Karyawan.',
          effective_from: new Date('2024-01-01'),
          status: 'ACTIVE',
        },
      });

      // 3. Seed Tax Codes
      const taxCodesToSeed = [
        { code: 'VAT-EXEMPT-FISH', name: 'PPN Dibebaskan — Ikan Segar / Beku Alam (PP 49/2022)', type: 'VAT_OUTPUT', desc: 'Fasilitas PPN Dibebaskan Pasal 7 PP 49/2022 (Kode FP 080)' },
        { code: 'VAT-OUT-STD', name: 'PPN Keluaran Standar (11%)', type: 'VAT_OUTPUT', desc: 'PPN Penjualan Barang Hasil Pengolahan Ikan / Retail (Kode FP 010)' },
        { code: 'VAT-IN-CREDITABLE', name: 'PPN Masukan Dapat Dikreditkan', type: 'VAT_INPUT', desc: 'Pajak Masukan Pembelian Bahan Penolong / Jasa Operasional' },
        { code: 'VAT-IN-NONCREDIT', name: 'PPN Masukan Tidak Dapat Dikreditkan', type: 'VAT_INPUT', desc: 'Pajak Masukan yang tidak ada hubungan langsung dengan kegiatan usaha' },
        { code: 'PPH22-FISH-BUY', name: 'PPh 22 Pembelian Hasil Perikanan (0.25%)', type: 'WHT_22', desc: 'Pemungutan PPh 22 atas pembelian ikan dari pedagang pengumpul' },
        { code: 'PPH23-SRV-LOGISTICS', name: 'PPh 23 Jasa Ekspedisi / Sewa Cold Storage (2%)', type: 'WHT_23', desc: 'Pemotongan PPh 23 atas jasa pengangkutan dan sewa alat pendingin' },
        { code: 'PPH21-TER', name: 'PPh 21 Karyawan TER (PMK 168/2023)', type: 'WHT_21', desc: 'Pemotongan PPh 21 skema TER Bulanan' },
        { code: 'PPH-FINAL-UMKM', name: 'PPh Final UMKM 0.5% (PP 55/2022)', type: 'PPH_FINAL', desc: 'Pajak final omzet kotor peredaran usaha' },
      ];

      for (const tc of taxCodesToSeed) {
        const createdCode = await tx.taxCode.upsert({
          where: { company_id_code: { company_id: companyId, code: tc.code } },
          update: {},
          create: {
            company_id: companyId,
            code: tc.code,
            name: tc.name,
            tax_type: tc.type,
            description: tc.desc,
            is_active: true,
          },
        });

        // 4. Attach Rules to Codes
        if (tc.code === 'VAT-EXEMPT-FISH') {
          const ruleExists = await tx.taxRule.findFirst({ where: { tax_code_id: createdCode.id } });
          if (!ruleExists) {
            const rule = await tx.taxRule.create({
              data: {
                regulation_id: regPP49.id,
                tax_code_id: createdCode.id,
                tax_treatment: 'EXEMPT',
                calculation_method: 'PERCENTAGE',
                tariff_rate: 0.0,
                dpp_factor: 1.0,
                is_creditable: false,
                requires_npwp: false,
                effective_from: new Date('2022-12-12'),
                status: 'ACTIVE',
              },
            });
            await tx.taxRuleVersion.create({
              data: {
                rule_id: rule.id,
                version_number: 1,
                change_reason: 'Statutory Exemption PP 49/2022',
                tariff_rate_snapshot: 0.0,
                dpp_factor_snapshot: 1.0,
                effective_from: new Date('2022-12-12'),
                approved_by: userId,
              },
            });
          }
        } else if (tc.code === 'VAT-OUT-STD') {
          const ruleExists = await tx.taxRule.findFirst({ where: { tax_code_id: createdCode.id } });
          if (!ruleExists) {
            const rule = await tx.taxRule.create({
              data: {
                regulation_id: regPMK131.id,
                tax_code_id: createdCode.id,
                tax_treatment: 'STANDARD',
                calculation_method: 'PERCENTAGE',
                tariff_rate: 0.11, // 11% standard
                dpp_factor: 1.0,
                is_creditable: true,
                requires_npwp: true,
                effective_from: new Date('2024-01-01'),
                status: 'ACTIVE',
              },
            });
            await tx.taxRuleVersion.create({
              data: {
                rule_id: rule.id,
                version_number: 1,
                change_reason: 'Standard 11% VAT rate',
                tariff_rate_snapshot: 0.11,
                dpp_factor_snapshot: 1.0,
                effective_from: new Date('2024-01-01'),
                approved_by: userId,
              },
            });
            // Account mapping for VAT-OUT-STD
            await tx.taxAccountMapping.upsert({
              where: {
                company_id_tax_code_id_transaction_type: {
                  company_id: companyId,
                  tax_code_id: createdCode.id,
                  transaction_type: 'SALES_INVOICE',
                },
              },
              update: {},
              create: {
                company_id: companyId,
                tax_code_id: createdCode.id,
                transaction_type: 'SALES_INVOICE',
                debit_account_id: accPpnKeluaran.id, // Balanced via AR
                credit_account_id: accPpnKeluaran.id,
                status: 'ACTIVE',
              },
            });
          }
        } else if (tc.code === 'PPH23-SRV-LOGISTICS') {
          const ruleExists = await tx.taxRule.findFirst({ where: { tax_code_id: createdCode.id } });
          if (!ruleExists) {
            const rule = await tx.taxRule.create({
              data: {
                regulation_id: regPMK131.id,
                tax_code_id: createdCode.id,
                tax_treatment: 'STANDARD',
                calculation_method: 'PERCENTAGE',
                tariff_rate: 0.02, // 2%
                dpp_factor: 1.0,
                requires_npwp: true,
                non_npwp_penalty_rate: 1.0, // 100% surcharge without NPWP = 4%
                effective_from: new Date('2024-01-01'),
                status: 'ACTIVE',
              },
            });
            await tx.taxRuleVersion.create({
              data: {
                rule_id: rule.id,
                version_number: 1,
                change_reason: 'PPh 23 Jasa 2% / 4% Non-NPWP',
                tariff_rate_snapshot: 0.02,
                dpp_factor_snapshot: 1.0,
                effective_from: new Date('2024-01-01'),
                approved_by: userId,
              },
            });
            await tx.taxAccountMapping.upsert({
              where: {
                company_id_tax_code_id_transaction_type: {
                  company_id: companyId,
                  tax_code_id: createdCode.id,
                  transaction_type: 'VENDOR_BILL',
                },
              },
              update: {},
              create: {
                company_id: companyId,
                tax_code_id: createdCode.id,
                transaction_type: 'VENDOR_BILL',
                debit_account_id: accPph23.id,
                credit_account_id: accPph23.id,
                status: 'ACTIVE',
              },
            });
          }
        }
      }

      // 5. Initial Classification for existing fish products
      const existingProducts = await tx.product.findMany({
        where: { company_id: companyId, status: true },
      });

      const exemptCode = await tx.taxCode.findUnique({
        where: { company_id_code: { company_id: companyId, code: 'VAT-EXEMPT-FISH' } },
      });
      const stdCode = await tx.taxCode.findUnique({
        where: { company_id_code: { company_id: companyId, code: 'VAT-OUT-STD' } },
      });

      for (const prod of existingProducts) {
        const lowerName = prod.name.toLowerCase();
        let species = 'OTHER';
        if (lowerName.includes('tuna')) species = 'TUNA';
        else if (lowerName.includes('kerapu')) species = 'KERAPU';
        else if (lowerName.includes('mahi')) species = 'MAHI_MAHI';
        else if (lowerName.includes('udang')) species = 'UDANG';
        else if (lowerName.includes('tenggiri')) species = 'TENGGIRI';

        let isExempt = true;
        let condition = 'FRESH_CHILLED';
        let cutting = 'WHOLE';
        let facility = 'DIBEBASKAN_PP_49_2022_PASAL_7';
        let legalRef = 'PP No. 49 Tahun 2022 Pasal 7 ayat (2) Huruf b';

        if (lowerName.includes('fillet') || lowerName.includes('steak') || lowerName.includes('masak')) {
          isExempt = false;
          condition = 'PROCESSED_SMOKED';
          cutting = 'FILLET_SKINLESS';
          facility = 'NONE';
          legalRef = 'UU HPP Klaster PPN — BKP Hasil Olahan Terutang PPN Standar 11%';
        } else if (lowerName.includes('es batu')) {
          isExempt = true;
          condition = 'FRESH_CHILLED';
          cutting = 'WHOLE';
          facility = 'NONE';
          legalRef = 'Barang Bukan Objek PPN (Non-BKP)';
        }

        await tx.productTaxClassification.upsert({
          where: { product_id: prod.id },
          update: {},
          create: {
            company_id: companyId,
            product_id: prod.id,
            fish_species_category: species,
            scientific_name: species === 'TUNA' ? 'Thunnus albacares' : null,
            product_condition: condition,
            cutting_form: cutting,
            origin_type: 'WILD_CAPTURE_MARINE',
            hs_code: species === 'TUNA' ? '0302.32.00' : '0302.89.00',
            vat_classification: isExempt ? 'EXEMPT_FACILITY' : 'STANDARD_TAXABLE',
            tax_facility: facility,
            legal_reference: legalRef,
            tax_code_id: isExempt ? exemptCode?.id : stdCode?.id,
            review_status: 'VERIFIED',
            reviewed_by: userId,
            reviewed_at: new Date(),
            review_notes: 'Klasifikasi awal otomatis sesuai PP 49/2022 untuk produk perikanan.',
            regulatory_evidence: legalRef,
            effective_from: new Date('2024-01-01'),
          },
        });
      }

      this.logger.log(`Seeding completed successfully for company ${companyId}`);
      return { success: true };
    });
    } catch (err: any) {
      this.logger.error(`Error during seedDefaultTaxRegulationsAndRules: ${err?.message}`, err?.stack);
      throw err;
    }
  }
}
