import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SalesCompletedEvent } from '../events/sales-completed.event';
import { 
  InvoicePostedEvent, 
  PaymentProcessedEvent, 
  PayrollPostedEvent, 
  PayrollPaymentEvent, 
  InventoryValuationEvent 
} from '../events/accounting.events';
import { GlService } from '../gl/gl.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountingListener {
  private readonly logger = new Logger(AccountingListener.name);

  constructor(
    private glService: GlService,
    private prisma: PrismaService
  ) {}

  private async resolveAccount(tx: any, companyId: string, codes: string[], names: string[]): Promise<string> {
    for (const code of codes) {
      const acc = await tx.chartOfAccount.findFirst({ where: { company_id: companyId, account_code: code } });
      if (acc) return acc.id;
    }
    for (const name of names) {
      const acc = await tx.chartOfAccount.findFirst({ where: { company_id: companyId, account_name: name } });
      if (acc) return acc.id;
    }
    throw new BadRequestException(`Accounting configuration error: Missing COA for ${names[0]} or codes [${codes.join(',')}]`);
  }

  private async checkIdempotency(tx: any, companyId: string, refType: string, refId: string) {
    const existing = await tx.journalEntry.findFirst({
      where: { company_id: companyId, reference_type: refType, reference_id: refId }
    });
    if (existing) {
      this.logger.warn(`Journal entry already exists for ${refType} ${refId}. Skipping.`);
      return true;
    }
    return false;
  }

  @OnEvent('sales.completed', { async: false })
  async handleSalesCompleted(event: SalesCompletedEvent) {
    const tx = event.tx || this.prisma;
    if (await this.checkIdempotency(tx, event.companyId, 'POS', event.sourceEntityId)) return;

    let debitAccountId: string;
    if (event.payload.paymentMethod === 'CASH') {
      debitAccountId = await this.resolveAccount(tx, event.companyId, ['1-1001', '1000'], ['Kas Utama', 'Cash']);
    } else {
      debitAccountId = await this.resolveAccount(tx, event.companyId, ['1-1002', '1001'], ['Bank (QRIS/EDC)', 'Bank']);
    }
    const creditAccountId = await this.resolveAccount(tx, event.companyId, ['4-1001', '4000'], ['Pendapatan Penjualan POS', 'Sales Revenue']);

    await this.glService.createJournalEntryWithinTx(tx as any, {
      companyId: event.companyId,
      entryDate: event.occurredAt,
      referenceType: 'POS',
      referenceId: event.sourceEntityId,
      description: `Penjualan POS (Event ${event.eventId})`,
      items: [
        { accountId: debitAccountId, debit: event.payload.totalAmount, credit: 0 },
        { accountId: creditAccountId, debit: 0, credit: event.payload.totalAmount },
      ]
    });
  }

  @OnEvent('invoice.posted', { async: false })
  async handleInvoicePosted(event: InvoicePostedEvent) {
    const tx = event.tx || this.prisma;
    if (await this.checkIdempotency(tx, event.companyId, event.payload.type, event.sourceEntityId)) return;

    if (event.payload.type === 'SALES_INVOICE') {
      const debitAccount = await this.resolveAccount(tx, event.companyId, ['1-1200', '1200'], ['Piutang Usaha', 'Accounts Receivable']);
      const creditAccount = await this.resolveAccount(tx, event.companyId, ['4-1000', '4000'], ['Pendapatan Penjualan', 'Sales Revenue']);
      
      await this.glService.createJournalEntryWithinTx(tx as any, {
        companyId: event.companyId,
        entryDate: event.occurredAt,
        referenceType: event.payload.type,
        referenceId: event.sourceEntityId,
        description: `Sales Invoice Posting (Event ${event.eventId})`,
        items: [
          { accountId: debitAccount, debit: event.payload.totalAmount, credit: 0 },
          { accountId: creditAccount, debit: 0, credit: event.payload.totalAmount },
        ]
      });
    } else if (event.payload.type === 'VENDOR_BILL') {
      const debitAccount = await this.resolveAccount(tx, event.companyId, ['1-1300', '1300', '5-1000'], ['Persediaan Barang', 'Inventory Asset', 'Pembelian']);
      const creditAccount = await this.resolveAccount(tx, event.companyId, ['2-1100', '2100'], ['Hutang Usaha', 'Accounts Payable']);

      await this.glService.createJournalEntryWithinTx(tx as any, {
        companyId: event.companyId,
        entryDate: event.occurredAt,
        referenceType: event.payload.type,
        referenceId: event.sourceEntityId,
        description: `Vendor Bill Posting (Event ${event.eventId})`,
        items: [
          { accountId: debitAccount, debit: event.payload.totalAmount, credit: 0 },
          { accountId: creditAccount, debit: 0, credit: event.payload.totalAmount },
        ]
      });
    }
  }

  @OnEvent('payment.received', { async: false })
  async handlePaymentProcessed(event: PaymentProcessedEvent) {
    const tx = event.tx || this.prisma;
    if (await this.checkIdempotency(tx, event.companyId, 'PAYMENT', event.sourceEntityId)) return;

    const cashAccount = await tx.cashAccount.findFirst({ where: { id: event.payload.accountId } });
    if (!cashAccount) throw new BadRequestException('CashAccount not found');

    const bankAccountGl = await this.resolveAccount(tx, event.companyId, ['1-1001', '1-1002', '1000', '1001'], ['Kas Utama', 'Bank', cashAccount.name]);

    if (event.payload.type === 'RECEIVABLE') {
      const arAccount = await this.resolveAccount(tx, event.companyId, ['1-1200', '1200'], ['Piutang Usaha', 'Accounts Receivable']);
      await this.glService.createJournalEntryWithinTx(tx as any, {
        companyId: event.companyId,
        entryDate: event.occurredAt,
        referenceType: 'PAYMENT_AR',
        referenceId: event.sourceEntityId,
        description: `AR Payment Received (Event ${event.eventId})`,
        items: [
          { accountId: bankAccountGl, debit: event.payload.amount, credit: 0 },
          { accountId: arAccount, debit: 0, credit: event.payload.amount },
        ]
      });
    } else if (event.payload.type === 'PAYABLE') {
      const apAccount = await this.resolveAccount(tx, event.companyId, ['2-1100', '2100'], ['Hutang Usaha', 'Accounts Payable']);
      await this.glService.createJournalEntryWithinTx(tx as any, {
        companyId: event.companyId,
        entryDate: event.occurredAt,
        referenceType: 'PAYMENT_AP',
        referenceId: event.sourceEntityId,
        description: `AP Payment Sent (Event ${event.eventId})`,
        items: [
          { accountId: apAccount, debit: event.payload.amount, credit: 0 },
          { accountId: bankAccountGl, debit: 0, credit: event.payload.amount },
        ]
      });
    }
  }

  @OnEvent('payroll.posted', { async: false })
  async handlePayrollPosted(event: PayrollPostedEvent) {
    const tx = event.tx || this.prisma;
    if (await this.checkIdempotency(tx, event.companyId, 'PAYROLL', event.sourceEntityId)) return;

    const expenseAccount = await this.resolveAccount(tx, event.companyId, ['6-1001', '6000'], ['Beban Gaji', 'Salary Expense']);
    const liabilityAccount = await this.resolveAccount(tx, event.companyId, ['2-1200', '2200'], ['Hutang Gaji', 'Salary Payable']);

    await this.glService.createJournalEntryWithinTx(tx as any, {
      companyId: event.companyId,
      entryDate: event.occurredAt,
      referenceType: 'PAYROLL',
      referenceId: event.sourceEntityId,
      description: `Payroll Posted for ${event.payload.period} (Event ${event.eventId})`,
      items: [
        { accountId: expenseAccount, debit: event.payload.netSalary, credit: 0 },
        { accountId: liabilityAccount, debit: 0, credit: event.payload.netSalary },
      ]
    });
  }

  @OnEvent('payroll.payment', { async: false })
  async handlePayrollPayment(event: PayrollPaymentEvent) {
    const tx = event.tx || this.prisma;
    if (await this.checkIdempotency(tx, event.companyId, 'PAYROLL_PAYMENT', event.sourceEntityId)) return;

    const liabilityAccount = await this.resolveAccount(tx, event.companyId, ['2-1200', '2200'], ['Hutang Gaji', 'Salary Payable']);
    const cashAccount = await this.resolveAccount(tx, event.companyId, ['1-1001', '1000', '1-1002', '1001'], ['Kas Utama', 'Bank']);

    await this.glService.createJournalEntryWithinTx(tx as any, {
      companyId: event.companyId,
      entryDate: event.occurredAt,
      referenceType: 'PAYROLL_PAYMENT',
      referenceId: event.sourceEntityId,
      description: `Payroll Payment (Event ${event.eventId})`,
      items: [
        { accountId: liabilityAccount, debit: event.payload.amount, credit: 0 },
        { accountId: cashAccount, debit: 0, credit: event.payload.amount },
      ]
    });
  }

  @OnEvent('inventory.valuation', { async: false })
  async handleInventoryValuation(event: InventoryValuationEvent) {
    const tx = event.tx || this.prisma;
    if (await this.checkIdempotency(tx, event.companyId, event.payload.type, event.sourceEntityId)) return;

    const inventoryAsset = await this.resolveAccount(tx, event.companyId, ['1-1300', '1300'], ['Persediaan Barang', 'Inventory Asset']);

    let debitAccount: string = '';
    let creditAccount: string = '';

    if (event.payload.type === 'COGS') {
      const cogsAccount = await this.resolveAccount(tx, event.companyId, ['5-1000', '5000'], ['Harga Pokok Penjualan', 'COGS']);
      debitAccount = cogsAccount;
      creditAccount = inventoryAsset;
    } else if (event.payload.type === 'ADJUSTMENT_LOSS') {
      const lossAccount = await this.resolveAccount(tx, event.companyId, ['6-2000', '6200'], ['Beban Penyesuaian Persediaan', 'Inventory Loss', 'Beban Persediaan']);
      debitAccount = lossAccount;
      creditAccount = inventoryAsset;
    } else if (event.payload.type === 'ADJUSTMENT_GAIN') {
      const gainAccount = await this.resolveAccount(tx, event.companyId, ['4-2000', '4200'], ['Pendapatan Penyesuaian', 'Inventory Gain']);
      debitAccount = inventoryAsset;
      creditAccount = gainAccount;
    } else if (event.payload.type === 'GOODS_RECEIPT') {
      // In this specific architecture, Goods Receipt isn't directly creating AP, Vendor Bill does.
      // Or maybe it does? The user said "If the existing system recognizes inventory only at Vendor Bill posting: preserve that behavior."
      // We mapped Vendor Bill -> Inventory Asset / AP. So GOODS_RECEIPT is skipped from GL to prevent double accounting!
      this.logger.log('Goods Receipt skipped for GL because Vendor Bill handles AP/Inventory Asset recognition.');
      return;
    }

    await this.glService.createJournalEntryWithinTx(tx as any, {
      companyId: event.companyId,
      entryDate: event.occurredAt,
      referenceType: event.payload.type,
      referenceId: event.sourceEntityId,
      description: event.payload.description || `Inventory Valuation (Event ${event.eventId})`,
      items: [
        { accountId: debitAccount, debit: event.payload.totalValue, credit: 0 },
        { accountId: creditAccount, debit: 0, credit: event.payload.totalValue },
      ]
    });
  }
}
