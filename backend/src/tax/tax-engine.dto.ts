export interface TaxCalculationLineInput {
  productId?: string;
  itemCode?: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  discount?: number;
  taxCodeId?: string; // Optional manual override
}

export interface TaxCalculationLineOutput {
  productId?: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  dpp: number;

  // Explicit Phase 10.3 Separated Tax Fields
  product_vat_classification: 'TAXABLE' | 'EXEMPT' | 'ZERO_RATED' | 'NOT_SUBJECT' | 'REVIEW_REQUIRED';
  seller_pkp_status: boolean;
  output_vat_treatment: 'TAXABLE' | 'EXEMPT' | 'ZERO_RATED' | 'NOT_SUBJECT' | 'NOT_COLLECTED';
  output_vat_rate: number;
  output_vat_amount: number;
  input_vat_creditability: 'CREDITABLE' | 'NON_CREDITABLE' | 'NOT_APPLICABLE';
  vat_collection_eligible: boolean;
  tax_invoice_issuance_eligible: boolean;

  // Legacy mappings for backwards compatibility
  taxTreatment: 'STANDARD' | 'SPECIAL_DPP' | 'EXEMPT' | 'NOT_COLLECTED' | 'NON_TAXABLE';
  taxType: string;
  tariffRate: number;
  dppFactor: number;
  taxAmount: number;
  isCreditable: boolean;
  legalReference: string;
  taxFacility?: string;
  ruleVersionId?: string;
  calculationTrace: string;
}

export interface TaxCalculationResult {
  transactionType: string;
  asOfDate: Date;
  subtotalGross: number;
  totalDiscount: number;
  dppStandard: number;
  dppSpecial: number;
  dppExempt: number;
  dppNotCollected: number;
  totalVatAmount: number;
  totalWithholdingAmount: number;
  grandTotal: number;
  lines: TaxCalculationLineOutput[];
  journalSuggestedLines: {
    accountId?: string;
    accountCodeHint: string;
    debit: number;
    credit: number;
    description: string;
  }[];
}
