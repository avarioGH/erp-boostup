export interface CreateTaxProfileDto {
  companyId: string;
  npwp: string;
  nitku?: string;
  taxpayerName: string;
  taxOfficeCode?: string;
  kluCode?: string;
  isPkp?: boolean;
  pkpNumber?: string;
  pkpDate?: Date;
  hasBranches?: boolean;
  signerAuthType?: 'CERTIFICATE' | 'DJP_CODE';
  signerName?: string;
  signerPosition?: string;
  signerNik?: string;
  djpAuthCode?: string;
  certificateExpiry?: Date;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface CreateTaxRegulationDto {
  companyId: string;
  regulationNumber: string;
  title: string;
  lawType: string; // UU, PP, PMK, PER_DIRJEN
  category: string; // VAT, PPH_21, PPH_22, PPH_23, PPH_FINAL, CORPORATE_TAX
  description?: string;
  sourceDocumentUrl?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface CreateTaxCodeDto {
  companyId: string;
  code: string;
  name: string;
  taxType: string; // VAT_OUTPUT, VAT_INPUT, WHT_21, WHT_22, WHT_23, WHT_4_2, PPH_25, CIT
  description?: string;
}

export interface CreateTaxRuleDto {
  companyId: string;
  regulationId: string;
  taxCodeId: string;
  taxTreatment: string; // STANDARD, SPECIAL_DPP, EXEMPT, NOT_COLLECTED, NON_TAXABLE
  calculationMethod: string; // PERCENTAGE, FLAT, PROGRESSIVE_TIER, TER_CATEGORY
  tariffRate: number; // e.g. 0.11 or 0.12 or 0.02
  dppFactor?: number; // default 1.0
  minimumThreshold?: number;
  isCreditable?: boolean;
  requiresNpwp?: boolean;
  nonNpwpPenaltyRate?: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  userId?: string;
  reason?: string;
}

export interface CreateTaxAccountMappingDto {
  companyId: string;
  taxCodeId: string;
  transactionType: string; // SALES_INVOICE, VENDOR_BILL, POS, PAYROLL, SALES_RETURN, PURCHASE_RETURN
  debitAccountId: string;
  creditAccountId: string;
}

export interface UpdateProductTaxClassificationDto {
  companyId: string;
  productId: string;
  fishSpeciesCategory: string; // TUNA, KERAPU, MAHI_MAHI, UDANG, TENGGIRI, SALMON, OTHER
  scientificName?: string;
  productCondition: string; // FRESH_CHILLED, FROZEN, PROCESSED_SMOKED, PROCESSED_CANNED, DRIED_SALTED
  cuttingForm: string; // WHOLE, ROUND, GUTTED_GILLED, FILLET_SKIN_ON, FILLET_SKINLESS, LOIN, STEAK, PORTION
  originType: string; // WILD_CAPTURE_MARINE, AQUACULTURE_FRESHWATER, AQUACULTURE_BRACKISH, IMPORTED
  hsCode?: string;
  vatClassification: string; // EXEMPT_FACILITY, STANDARD_TAXABLE, NOT_SUBJECT, LUXURY_TAX
  taxFacility?: string; // DIBEBASKAN_PP_49_2022_PASAL_7, TIDAK_DIPUNGUT_KAWASAN_BERIKAT, NONE
  legalReference: string;
  taxCodeId?: string;
  reviewStatus?: string; // PENDING_REVIEW, VERIFIED, REJECTED
  reviewedBy?: string;
  reviewNotes?: string;
  regulatoryEvidence?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}


export interface CreateTaxInvoiceDto {
  companyId: string;
  invoiceId?: string;
  invoiceType: 'OUTPUT' | 'INPUT';
  transactionCode: string; // 01, 04, 07, 08, etc.
  statusCode?: string; // 0 normal, 1 pengganti
  nsfp: string;
  taxPeriodMonth: number;
  taxPeriodYear: number;
  invoiceDate: Date;
  counterpartyName: string;
  counterpartyNpwp: string;
  counterpartyNitku?: string;
  counterpartyAddress?: string;
  dppAmount: number;
  vatAmount: number;
  luxuryTaxAmount?: number;
  isCreditable?: boolean;
  referenceNote?: string;
  replacementForId?: string;
}

export interface CreateWithholdingCertificateDto {
  companyId: string;
  certificateNo: string;
  taxType: 'PPH_21' | 'PPH_22' | 'PPH_23' | 'PPH_4_2' | 'PPH_26';
  taxObjectCode: string;
  periodMonth: number;
  periodYear: number;
  transactionDate: Date;
  taxpayerType: 'BADAN' | 'ORANG_PRIBADI';
  taxpayerId: string; // NPWP / NIK
  taxpayerName: string;
  taxpayerAddress?: string;
  grossAmount: number;
  taxRate: number;
  withholdingAmount: number;
  referenceType: string;
  referenceId: string;
}

export interface CreateFiscalAdjustmentDto {
  companyId: string;
  fiscalYear: number;
  adjustmentType: 'POSITIVE' | 'NEGATIVE';
  category: string;
  description: string;
  legalReference: string;
  commercialAmount: number;
  fiscalAmount: number;
  glAccountCode?: string;
  auditEvidence?: string;
}

export interface CalculateCorporateTaxDto {
  companyId: string;
  fiscalYear: number;
  isEligiblePasal31e?: boolean;
}
