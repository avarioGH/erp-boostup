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
  taxTreatment: 'STANDARD' | 'SPECIAL_DPP' | 'EXEMPT' | 'NOT_COLLECTED' | 'NON_TAXABLE';
  taxType: string;
  tariffRate: number;
  dppFactor: number;
  taxAmount: number;
  isCreditable: boolean;
  legalReference: string;
  taxFacility?: string;
  ruleVersionId?: string;
  calculationTrace: string; // Detailed audit trace string
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
