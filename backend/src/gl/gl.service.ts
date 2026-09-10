import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface CreateJournalDto {
  companyId: string;
  entryDate: Date;
  referenceType: string;
  referenceId: string;
  description?: string;
  items: {
    accountId: string;
    debit: number;
    credit: number;
  }[];
}

@Injectable()
export class GlService {
  private readonly logger = new Logger(GlService.name);

  constructor(private prisma: PrismaService) {}
  
  /**
   * Helper function to create Journal Entry within an existing Prisma Transaction.
   * Ensuring 100% ACID compliance across modules.
   */
  async createJournalEntryWithinTx(tx: Prisma.TransactionClient, data: CreateJournalDto) {
    // 1. Validate Balance (Debit must equal Credit)
    
    const period = await tx.accountingPeriod.findFirst({
      where: {
        company_id: data.companyId,
        start_date: { lte: data.entryDate },
        end_date: { gte: data.entryDate }
      }
    });

    if (!period) {
      throw new Error('NO_ACCOUNTING_PERIOD: Cannot post without an open accounting period.');
    }
    if (period.status === 'CLOSED') {
      throw new Error('ACCOUNTING_PERIOD_CLOSED: Cannot post to a closed period.');
    }
    if (period.status === 'LOCKED') {
      throw new Error('ACCOUNTING_PERIOD_LOCKED: Cannot post to a locked period.');
    }

    const totalDebit = data.items.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = data.items.reduce((sum, item) => sum + item.credit, 0);

    if (totalDebit !== totalCredit) {
      throw new Error(`Journal Entry is unbalanced. Debit: ${totalDebit}, Credit: ${totalCredit}`);
    }

    // 2. Create Journal Header
    const journal = await tx.journalEntry.create({
      data: {
        company_id: data.companyId,
        journal_no: `JNL-${Date.now()}`,
        journal_date: data.entryDate,
        reference_type: data.referenceType,
        reference_id: data.referenceId,
          idempotency_key: (data.referenceType && data.referenceId) ? `${data.companyId}-${data.referenceType}-${data.referenceId}` : undefined,
          description: data.description,
          status: 'Posted',
          created_by: (data as any).userId || '000000000000000000000999',
      }
    });

    // 3. Create Journal Items and Aggregate Cash Movements
    const cashDeltas = new Map<string, number>();

    for (const item of data.items) {
      if (item.debit > 0 || item.credit > 0) {
        await tx.journalEntryItem.create({
          data: {
            journal_entry_id: journal.id,
            account_id: item.accountId,
            debit: item.debit,
            credit: item.credit,
          }
        });

        const cashAccounts = await tx.cashAccount.findMany({
          where: { company_id: data.companyId, chart_of_account_id: item.accountId }
        });
        
        if (cashAccounts.length > 0) {
          const coa = await tx.chartOfAccount.findUnique({
             where: { id: item.accountId },
             include: { account_type: true }
          });
          
          let diff = item.debit - item.credit;
          if (coa?.account_type?.normal_balance === 'Credit') {
             diff = item.credit - item.debit;
          }
          
          for (const cashAcc of cashAccounts) {
             cashDeltas.set(cashAcc.id, (cashDeltas.get(cashAcc.id) || 0) + diff);
          }
        }
      }
    }

    // Apply NET cash movement exactly once per cash account
    for (const [cashAccId, netDiff] of cashDeltas.entries()) {
      if (netDiff !== 0) {
        await tx.cashAccount.update({
          where: { id: cashAccId },
          data: { current_balance: { increment: netDiff } }
        });
      }
    }

    return journal;
  }

  async reverseJournal(companyId: string, originalJournalId: string, reason: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.journalEntry.findUnique({
        where: { id: originalJournalId },
        include: { items: true }
      });

      if (!original || original.company_id !== companyId) throw new Error('Journal not found');
      if (original.status === 'Reversed') throw new Error('Journal is already reversed');

      const today = new Date();
      // Period validation for the REVERSAL date (today)
      const period = await tx.accountingPeriod.findFirst({
        where: {
          company_id: companyId,
          start_date: { lte: today },
          end_date: { gte: today }
        }
      });

      if (!period) throw new Error('NO_ACCOUNTING_PERIOD: Reversal date lacks an accounting period.');
      if (period.status === 'CLOSED') throw new Error('ACCOUNTING_PERIOD_CLOSED');
      if (period.status === 'LOCKED') throw new Error('ACCOUNTING_PERIOD_LOCKED');

      const reversedJournal = await tx.journalEntry.create({
        data: {
          company_id: companyId,
          journal_no: "REV-" + original.journal_no,
          reference_type: 'REVERSAL',
          reference_id: original.id,
          journal_date: today,
          description: "Reversal of " + original.journal_no + ": " + reason,
          status: 'Posted',
          created_by: userId,
          items: {
            create: original.items.map(item => ({
              account_id: item.account_id,
              debit: item.credit,
              credit: item.debit,
              description: "Reversal: " + item.description,
            }))
          }
        }
      });

      await tx.journalEntry.update({
        where: { id: original.id },
        data: { status: 'Reversed' }
      });

      await tx.journalReversal.create({
        data: {
          company_id: companyId,
          original_journal_id: original.id,
          reverse_journal_id: reversedJournal.id,
          reason: reason,
          created_by: userId,
        }
      });

            const revCashDeltas = new Map<string, number>();

      for (const item of original.items) {
        const cashAccounts = await tx.cashAccount.findMany({
          where: { company_id: companyId, chart_of_account_id: item.account_id }
        });
        
        if (cashAccounts.length > 0) {
          const coa = await tx.chartOfAccount.findUnique({
             where: { id: item.account_id },
             include: { account_type: true }
          });
          
          let diff = item.credit - item.debit;
          if (coa?.account_type?.normal_balance === 'Credit') {
             diff = item.debit - item.credit;
          }
          
          for (const cashAcc of cashAccounts) {
             revCashDeltas.set(cashAcc.id, (revCashDeltas.get(cashAcc.id) || 0) + diff);
          }
        }
      }

      for (const [cashAccId, netDiff] of revCashDeltas.entries()) {
        if (netDiff !== 0) {
          await tx.cashAccount.update({
            where: { id: cashAccId },
            data: { current_balance: { increment: netDiff } }
          });
        }
      }

      return reversedJournal;
    });
  }


  async getTrialBalance(companyId: string) {
    return [];
  }

  async getGeneralLedger(companyId: string, accountId: string, page: number) {
    return { data: [], total: 0, page, totalPages: 0 };
  }

  async getARAging(companyId: string) {
    return [];
  }

  async getAPAging(companyId: string) {
    return [];
  }

  async getCustomerStatement(companyId: string, customerId: string) {
    return [];
  }

  async getSupplierStatement(companyId: string, supplierId: string) {
    return [];
  }

}
