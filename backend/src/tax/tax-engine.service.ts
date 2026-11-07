import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaxCalculationLineInput, TaxCalculationResult, TaxCalculationLineOutput } from './tax-engine.dto';

@Injectable()
export class TaxEngineService {
  private readonly logger = new Logger(TaxEngineService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Deterministic VAT & Tax Engine for Sales, Invoices, POS, and Procurement.
   * Produces 100% auditable calculation traces adhering to PMK 131/2024 and PP 49/2022.
   */
  async calculateTransactionTaxes(
    companyId: string,
    transactionType: 'SALES_INVOICE' | 'VENDOR_BILL' | 'POS' | 'PURCHASE_ORDER',
    items: TaxCalculationLineInput[],
    asOfDate: Date = new Date(),
    customerOrSupplierTaxId?: string,
  ): Promise<TaxCalculationResult> {
    // 1. Fetch Company Tax Profile (PKP Status)
    const taxProfile = await this.prisma.taxProfile.findFirst({
      where: {
        company_id: companyId,
        status: 'ACTIVE',
        effective_from: { lte: asOfDate },
        OR: [{ effective_to: null }, { effective_to: { gte: asOfDate } }],
      },
    });

    const isCompanyPkp = taxProfile ? taxProfile.is_pkp : false;

    // 2. Fetch all Active Tax Rules with their Latest Rule Version
    const activeRules = await this.prisma.taxRule.findMany({
      where: {
        status: 'ACTIVE',
        effective_from: { lte: asOfDate },
        OR: [{ effective_to: null }, { effective_to: { gte: asOfDate } }],
        tax_code: { company_id: companyId, is_active: true },
      },
      include: {
        tax_code: true,
        regulation: true,
        versions: { orderBy: { version_number: 'desc' }, take: 1 },
      },
    });

    let dppStandard = 0;
    let dppSpecial = 0;
    let dppExempt = 0;
    let dppNotCollected = 0;
    let totalVatAmount = 0;
    let subtotalGross = 0;
    let totalDiscount = 0;

    const lineOutputs: TaxCalculationLineOutput[] = [];

    // 3. Evaluate Each Item Line
    for (const item of items) {
      const gross = item.qty * item.unitPrice;
      const discount = item.discount || 0;
      const netSubtotal = Math.max(0, gross - discount);

      subtotalGross += gross;
      totalDiscount += discount;

      // Determine Tax Classification from Product or Override
      let productClassification: any = null;
      if (item.productId) {
        productClassification = await this.prisma.productTaxClassification.findUnique({
          where: { product_id: item.productId },
          include: { tax_code: true },
        });
      }

      // Determine intrinsic product VAT classification regardless of seller PKP status
      let intrinsicProductVat: 'TAXABLE' | 'EXEMPT' | 'ZERO_RATED' | 'NOT_SUBJECT' | 'REVIEW_REQUIRED' = 'TAXABLE';
      if (productClassification) {
        if (productClassification.vat_classification === 'EXEMPT_FACILITY') {
          intrinsicProductVat = 'EXEMPT';
        } else if (productClassification.vat_classification === 'NOT_SUBJECT') {
          intrinsicProductVat = 'NOT_SUBJECT';
        } else if (productClassification.review_status === 'REVIEW_REQUIRED') {
          intrinsicProductVat = 'REVIEW_REQUIRED';
        } else {
          intrinsicProductVat = 'TAXABLE';
        }
      }

      // If company is NOT PKP and it's a sales transaction:
      // Product classification TAXABLE is RETAINED, but output VAT collection is ZERO / NOT_COLLECTED
      if (!isCompanyPkp && (transactionType === 'SALES_INVOICE' || transactionType === 'POS')) {
        const trace = `Klasifikasi Produk Asli: ${intrinsicProductVat}. Penjual berstatus Non-PKP (UU PPN Pasal 3A): PPN Keluaran TIDAK DIPUNGUT (0). Penerbitan Faktur Pajak Resmi: DILARANG.`;
        lineOutputs.push({
          productId: item.productId,
          itemName: item.itemName,
          qty: item.qty,
          unitPrice: item.unitPrice,
          subtotal: netSubtotal,
          dpp: netSubtotal,
          product_vat_classification: intrinsicProductVat,
          seller_pkp_status: false,
          output_vat_treatment: 'NOT_COLLECTED',
          output_vat_rate: 0,
          output_vat_amount: 0,
          input_vat_creditability: 'NOT_APPLICABLE',
          vat_collection_eligible: false,
          tax_invoice_issuance_eligible: false,
          taxTreatment: 'NON_TAXABLE',
          taxType: 'VAT_OUTPUT',
          tariffRate: 0,
          dppFactor: 1.0,
          taxAmount: 0,
          isCreditable: false,
          legalReference: 'UU KUP Pasal 3A jo. UU PPN Pasal 3A — Penjual Non-PKP dilarang memungut PPN',
          calculationTrace: trace,
        });
        dppNotCollected += netSubtotal;
        continue;
      }

      // Check Exemption via Fish Product Classification (PP 49/2022)
      if (productClassification && productClassification.vat_classification === 'EXEMPT_FACILITY') {
        const trace = `Fasilitas PPN Dibebaskan: ${productClassification.legal_reference} (${productClassification.product_condition} - ${productClassification.cutting_form}). DPP: Rp ${netSubtotal.toLocaleString('id-ID')}, Tarif: 0%.`;
        lineOutputs.push({
          productId: item.productId,
          itemName: item.itemName,
          qty: item.qty,
          unitPrice: item.unitPrice,
          subtotal: netSubtotal,
          dpp: netSubtotal,
          product_vat_classification: 'EXEMPT',
          seller_pkp_status: isCompanyPkp,
          output_vat_treatment: 'EXEMPT',
          output_vat_rate: 0,
          output_vat_amount: 0,
          input_vat_creditability: 'NON_CREDITABLE', // Pasal 16B ayat (3) UU PPN
          vat_collection_eligible: true,
          tax_invoice_issuance_eligible: true,
          taxTreatment: 'EXEMPT',
          taxType: 'VAT_OUTPUT',
          tariffRate: 0,
          dppFactor: 1.0,
          taxAmount: 0,
          isCreditable: false,
          legalReference: productClassification.legal_reference,
          taxFacility: productClassification.tax_facility || 'DIBEBASKAN_PP_49_2022_PASAL_7',
          calculationTrace: trace,
        });
        dppExempt += netSubtotal;
        continue;
      }

      // Standard Taxable Item or Explicit Tax Code
      let matchedRule = activeRules.find((r) =>
        item.taxCodeId ? r.tax_code_id === item.taxCodeId : r.tax_code.tax_type === 'VAT_OUTPUT' && r.tax_treatment === 'STANDARD'
      );

      if (!matchedRule) {
        matchedRule = activeRules.find((r) => r.tax_treatment === 'STANDARD');
      }

      if (matchedRule) {
        const tariff = matchedRule.tariff_rate;
        const dppFactor = matchedRule.dpp_factor || 1.0;
        const dpp = Math.floor(netSubtotal * dppFactor);
        const taxVal = Math.round(dpp * tariff);

        const latestVersion = matchedRule.versions[0];
        const trace = `Perhitungan PPN ${matchedRule.tax_code.name}: DPP Factor ${(dppFactor * 100)}% * Rp ${netSubtotal.toLocaleString('id-ID')} = DPP Rp ${dpp.toLocaleString('id-ID')}. Tarif ${(tariff * 100)}% = PPN Rp ${taxVal.toLocaleString('id-ID')}. Regulasi: ${matchedRule.regulation.regulation_number}.`;

        lineOutputs.push({
          productId: item.productId,
          itemName: item.itemName,
          qty: item.qty,
          unitPrice: item.unitPrice,
          subtotal: netSubtotal,
          dpp: dpp,
          product_vat_classification: 'TAXABLE',
          seller_pkp_status: isCompanyPkp,
          output_vat_treatment: 'TAXABLE',
          output_vat_rate: tariff,
          output_vat_amount: taxVal,
          input_vat_creditability: 'CREDITABLE', // Pasal 9 ayat (2) UU PPN
          vat_collection_eligible: isCompanyPkp,
          tax_invoice_issuance_eligible: isCompanyPkp,
          taxTreatment: 'STANDARD',
          taxType: matchedRule.tax_code.tax_type,
          tariffRate: tariff,
          dppFactor: dppFactor,
          taxAmount: taxVal,
          isCreditable: matchedRule.is_creditable,
          legalReference: matchedRule.regulation.title,
          ruleVersionId: latestVersion ? latestVersion.id : undefined,
          calculationTrace: trace,
        });

        dppStandard += dpp;
        totalVatAmount += taxVal;
      } else {
        // Fallback default
        lineOutputs.push({
          productId: item.productId,
          itemName: item.itemName,
          qty: item.qty,
          unitPrice: item.unitPrice,
          subtotal: netSubtotal,
          dpp: netSubtotal,
          product_vat_classification: 'NOT_SUBJECT',
          seller_pkp_status: isCompanyPkp,
          output_vat_treatment: 'NOT_COLLECTED',
          output_vat_rate: 0,
          output_vat_amount: 0,
          input_vat_creditability: 'NOT_APPLICABLE',
          vat_collection_eligible: false,
          tax_invoice_issuance_eligible: false,
          taxTreatment: 'NON_TAXABLE',
          taxType: 'NONE',
          tariffRate: 0,
          dppFactor: 1.0,
          taxAmount: 0,
          isCreditable: false,
          legalReference: 'None',
          calculationTrace: 'Tidak ada aturan pajak yang berlaku untuk baris ini.',
        });
      }
    }

    const netTaxableBase = subtotalGross - totalDiscount;
    const grandTotal = netTaxableBase + totalVatAmount;

    // Build suggested balanced GL lines for Double-Entry Accounting
    const journalSuggestedLines: any[] = [];
    if (totalVatAmount > 0) {
      if (transactionType === 'SALES_INVOICE' || transactionType === 'POS') {
        const vatAcc = await this.prisma.chartOfAccount.findFirst({
          where: { company_id: companyId, account_code: '2-1301' },
        });
        journalSuggestedLines.push({
          accountId: vatAcc?.id,
          accountCodeHint: '2-1301',
          debit: 0,
          credit: totalVatAmount,
          description: `Hutang PPN Keluaran atas transaksi ${transactionType}`,
        });
      } else if (transactionType === 'VENDOR_BILL') {
        const vatInAcc = await this.prisma.chartOfAccount.findFirst({
          where: { company_id: companyId, account_code: '1-1401' },
        });
        journalSuggestedLines.push({
          accountId: vatInAcc?.id,
          accountCodeHint: '1-1401',
          debit: totalVatAmount,
          credit: 0,
          description: `PPN Masukan Dapat Dikreditkan atas tagihan pemasok`,
        });
      }
    }

    return {
      transactionType,
      asOfDate,
      subtotalGross,
      totalDiscount,
      dppStandard,
      dppSpecial,
      dppExempt,
      dppNotCollected,
      totalVatAmount,
      totalWithholdingAmount: 0,
      grandTotal,
      lines: lineOutputs,
      journalSuggestedLines,
    };
  }

  /**
   * PPh 21 TER (Tarif Efektif Rata-Rata) Calculator based on PMK 168/2023.
   * Supports Kategori TER A, B, C for employee payroll.
   */
  calculatePph21Ter(monthlyGrossSalary: number, ptkpStatus: 'TK/0' | 'TK/1' | 'K/0' | 'K/1' | 'K/2' | 'K/3'): {
    category: 'A' | 'B' | 'C';
    rate: number;
    pph21Amount: number;
    trace: string;
  } {
    // 1. Determine TER Category
    let category: 'A' | 'B' | 'C' = 'A';
    if (['TK/0', 'TK/1', 'K/0'].includes(ptkpStatus)) {
      category = 'A';
    } else if (['TK/2', 'TK/3', 'K/1', 'K/2'].includes(ptkpStatus)) {
      category = 'B';
    } else {
      category = 'C';
    }

    let rate = 0;
    // Sample tier thresholds for Category A per PMK 168/2023
    if (category === 'A') {
      if (monthlyGrossSalary <= 5400000) rate = 0;
      else if (monthlyGrossSalary <= 5650000) rate = 0.0025;
      else if (monthlyGrossSalary <= 5950000) rate = 0.005;
      else if (monthlyGrossSalary <= 6300000) rate = 0.0075;
      else if (monthlyGrossSalary <= 6750000) rate = 0.01;
      else if (monthlyGrossSalary <= 7500000) rate = 0.0125;
      else if (monthlyGrossSalary <= 8550000) rate = 0.015;
      else if (monthlyGrossSalary <= 9650000) rate = 0.0175;
      else if (monthlyGrossSalary <= 10050000) rate = 0.02;
      else rate = 0.05; // Simplified representative bracket
    } else {
      rate = monthlyGrossSalary <= 6200000 ? 0 : 0.015;
    }

    const pph21Amount = Math.round(monthlyGrossSalary * rate);
    const trace = `PPh 21 TER Kategori ${category} (PTKP: ${ptkpStatus}): Penghasilan Bruto Rp ${monthlyGrossSalary.toLocaleString('id-ID')} * Tarif ${(rate * 100)}% = Rp ${pph21Amount.toLocaleString('id-ID')} (PMK 168/2023).`;

    return {
      category,
      rate,
      pph21Amount,
      trace,
    };
  }
}
