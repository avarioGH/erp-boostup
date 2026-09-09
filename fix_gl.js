const fs = require('fs');

const code = import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  async createJournalEntryWithinTx(tx: Prisma.TransactionClient, data: CreateJournalDto) {
    const totalDebit = data.items.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = data.items.reduce((sum, item) => sum + item.credit, 0);

    if (totalDebit !== totalCredit) {
      throw new Error("Journal Entry is unbalanced. Debit: " + totalDebit + ", Credit: " + totalCredit);
    }

    const journal = await tx.journalEntry.create({
      data: {
        company_id: data.companyId,
        journal_no: "JNL-" + Date.now(),
        journal_date: data.entryDate,
        reference_type: data.referenceType,
        reference_id: data.referenceId,
        description: data.description,
        status: 'Posted',
        created_by: 'SYSTEM'
      }
    });

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
      }
    }

    return journal;
  }

  async getTrialBalance(companyId: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = { company_id: companyId, status: 'Posted' };
    if (startDate || endDate) {
      whereClause.journal_date = {};
      if (startDate) whereClause.journal_date.gte = startDate;
      if (endDate) whereClause.journal_date.lte = endDate;
    }

    const items = await this.prisma.journalEntryItem.groupBy({
      by: ['account_id'],
      where: {
        journal_entry: whereClause
      },
      _sum: {
        debit: true,
        credit: true
      }
    });

    const accounts = await this.prisma.chartOfAccount.findMany({ where: { company_id: companyId } });
    const accountMap = new Map<string, any>(accounts.map((a: any) => [a.id, a]));

    const result = items.map((item: any) => {
      const acc = accountMap.get(item.account_id);
      const sumDebit = item._sum.debit || 0;
      const sumCredit = item._sum.credit || 0;
      return {
        accountId: item.account_id,
        accountCode: acc?.account_code || 'N/A',
        accountName: acc?.account_name || 'Unknown',
        debit: sumDebit,
        credit: sumCredit,
        balance: sumDebit - sumCredit
      };
    });

    return result;
  }

  async getGeneralLedger(companyId: string, accountId?: string, page: number = 1, limit: number = 50) {
    const where: any = { journal_entry: { company_id: companyId, status: 'Posted' } };
    if (accountId) where.account_id = accountId;

    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      this.prisma.journalEntryItem.findMany({
        where,
        include: {
          journal_entry: true,
          account: true
        },
        orderBy: { journal_entry: { journal_date: 'desc' } },
        skip,
        take: limit
      }),
      this.prisma.journalEntryItem.count({ where })
    ]);

    return {
      data: items.map((i: any) => ({
        date: i.journal_entry.journal_date,
        journalNo: i.journal_entry.journal_no,
        accountName: i.account.account_name,
        description: i.description || i.journal_entry.description,
        debit: i.debit,
        credit: i.credit,
        reference: i.journal_entry.reference_type + (i.journal_entry.reference_id ? ' - ' + i.journal_entry.reference_id : '')
      })),
      total,
      page,
      limit
    };
  }

  async getARAging(companyId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        company_id: companyId,
        type: 'AR',
        status: { in: ['POSTED', 'PARTIALLY PAID'] }
      },
      include: { customer: true }
    });

    const now = new Date();
    const result = invoices.map((inv: any) => {
      const dueDate = inv.due_date || inv.invoice_date;
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(dueDate).getTime()) / (1000 * 3600 * 24)));
      let bucket = 'CURRENT';
      if (daysOverdue > 90) bucket = '90+';
      else if (daysOverdue > 60) bucket = '61-90';
      else if (daysOverdue > 30) bucket = '31-60';
      else if (daysOverdue > 0) bucket = '1-30';

      return {
        customerId: inv.customer_id,
        customerName: inv.customer?.name || 'Unknown',
        invoiceNumber: inv.invoice_number,
        dueDate: dueDate,
        total: inv.total,
        paid: inv.paid_amount,
        remaining: inv.remaining_amount,
        daysOverdue,
        bucket
      };
    });

    return result;
  }

  async getAPAging(companyId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        company_id: companyId,
        type: 'AP',
        status: { in: ['POSTED', 'PARTIALLY PAID'] }
      },
      include: { supplier: true }
    });

    const now = new Date();
    const result = invoices.map((inv: any) => {
      const dueDate = inv.due_date || inv.invoice_date;
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(dueDate).getTime()) / (1000 * 3600 * 24)));
      let bucket = 'CURRENT';
      if (daysOverdue > 90) bucket = '90+';
      else if (daysOverdue > 60) bucket = '61-90';
      else if (daysOverdue > 30) bucket = '31-60';
      else if (daysOverdue > 0) bucket = '1-30';

      return {
        supplierId: inv.supplier_id,
        supplierName: inv.supplier?.name || 'Unknown',
        invoiceNumber: inv.invoice_number,
        dueDate: dueDate,
        total: inv.total,
        paid: inv.paid_amount,
        remaining: inv.remaining_amount,
        daysOverdue,
        bucket
      };
    });

    return result;
  }

  async getCustomerStatement(companyId: string, customerId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { company_id: companyId, customer_id: customerId, type: 'AR', status: { not: 'DRAFT' } }
    });
    
    const payments = await this.prisma.payment.findMany({
      where: { company_id: companyId, invoice: { customer_id: customerId, type: 'AR' } }
    });

    const entries = [];
    
    invoices.forEach((inv) => {
      if (inv.status !== 'CANCELLED') {
         entries.push({
           date: inv.invoice_date,
           document: inv.invoice_number,
           description: 'Invoice',
           debit: inv.total,
           credit: 0
         });
      }
    });

    payments.forEach((pay) => {
      entries.push({
        date: pay.payment_date,
        document: pay.payment_number,
        description: 'Payment Recv',
        debit: 0,
        credit: pay.amount
      });
    });

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const statement = entries.map(e => {
      runningBalance += (e.debit - e.credit);
      return { ...e, runningBalance };
    });

    return statement;
  }

  async getSupplierStatement(companyId: string, supplierId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { company_id: companyId, supplier_id: supplierId, type: 'AP', status: { not: 'DRAFT' } }
    });
    
    const payments = await this.prisma.payment.findMany({
      where: { company_id: companyId, invoice: { supplier_id: supplierId, type: 'AP' } }
    });

    const entries = [];
    
    invoices.forEach((inv) => {
      if (inv.status !== 'CANCELLED') {
         entries.push({
           date: inv.invoice_date,
           document: inv.invoice_number,
           description: 'Vendor Bill',
           debit: 0,
           credit: inv.total
         });
      }
    });

    payments.forEach((pay) => {
      entries.push({
        date: pay.payment_date,
        document: pay.payment_number,
        description: 'Payment Sent',
        debit: pay.amount,
        credit: 0
      });
    });

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const statement = entries.map(e => {
      runningBalance += (e.credit - e.debit);
      return { ...e, runningBalance };
    });

    return statement;
  }
}
;

fs.writeFileSync('backend/src/gl/gl.service.ts', code, 'utf8');
