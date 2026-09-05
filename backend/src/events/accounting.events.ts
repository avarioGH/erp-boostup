import { Prisma } from '@prisma/client';

export class InvoicePostedEvent {
  constructor(
    public readonly companyId: string,
    public readonly sourceEntityId: string, // Invoice ID
    public readonly eventId: string,
    public readonly occurredAt: Date,
    public readonly payload: {
      type: string; // 'SALES_INVOICE' | 'VENDOR_BILL'
      totalAmount: number;
    },
    public readonly tx?: Prisma.TransactionClient
  ) {}
}

export class PaymentProcessedEvent {
  constructor(
    public readonly companyId: string,
    public readonly sourceEntityId: string, // Payment ID
    public readonly eventId: string,
    public readonly occurredAt: Date,
    public readonly payload: {
      type: string; // 'RECEIVABLE' | 'PAYABLE'
      amount: number;
      accountId: string; // CashAccount ID
    },
    public readonly tx?: Prisma.TransactionClient
  ) {}
}

export class PayrollPostedEvent {
  constructor(
    public readonly companyId: string,
    public readonly sourceEntityId: string, // Payroll ID
    public readonly eventId: string,
    public readonly occurredAt: Date,
    public readonly payload: {
      netSalary: number;
      period: string;
    },
    public readonly tx?: Prisma.TransactionClient
  ) {}
}

export class PayrollPaymentEvent {
  constructor(
    public readonly companyId: string,
    public readonly sourceEntityId: string, // Payroll ID
    public readonly eventId: string,
    public readonly occurredAt: Date,
    public readonly payload: {
      amount: number;
    },
    public readonly tx?: Prisma.TransactionClient
  ) {}
}

export class InventoryValuationEvent {
  constructor(
    public readonly companyId: string,
    public readonly sourceEntityId: string,
    public readonly eventId: string,
    public readonly occurredAt: Date,
    public readonly payload: {
      type: 'ADJUSTMENT_LOSS' | 'ADJUSTMENT_GAIN' | 'COGS' | 'GOODS_RECEIPT';
      totalValue: number;
      description?: string;
    },
    public readonly tx?: Prisma.TransactionClient
  ) {}
}
