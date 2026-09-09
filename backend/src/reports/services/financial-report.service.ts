import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportFilterDto, ReportResultDto } from '../report.types';

@Injectable()
export class FinancialReportService {
  constructor(private prisma: PrismaService) {}

  async getTrialBalance(filters: ReportFilterDto): Promise<ReportResultDto> {
    const whereCondition: any = {
      journal_entry: {
        company_id: filters.company_id,
        status: 'Posted',
      }
    };
    if (filters.start_date || filters.end_date) {
      whereCondition.journal_entry.journal_date = {};
      if (filters.start_date) whereCondition.journal_entry.journal_date.gte = new Date(filters.start_date);
      if (filters.end_date) whereCondition.journal_entry.journal_date.lte = new Date(filters.end_date);
    }
    if (filters.branch_id) {
       // Assuming branch can be filtered, wait, is there branch? No branch in JournalEntry
    }

    const items = await this.prisma.journalEntryItem.findMany({
      where: whereCondition,
      include: { account: { include: { account_type: true } } }
    });

    const accountMap = new Map<string, any>();
    items.forEach(item => {
      const acc = item.account;
      if (!accountMap.has(acc.id)) {
        accountMap.set(acc.id, {
          code: acc.account_code,
          name: acc.account_name,
          normal_balance: acc.account_type.normal_balance,
          debit: 0,
          credit: 0
        });
      }
      const data = accountMap.get(acc.id);
      data.debit += item.debit;
      data.credit += item.credit;
    });

    const data = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const [id, acc] of accountMap.entries()) {
      let balance = 0;
      if (acc.normal_balance === 'Debit') {
        balance = acc.debit - acc.credit;
      } else {
        balance = acc.credit - acc.debit;
      }
      totalDebit += acc.debit;
      totalCredit += acc.credit;

      data.push({
        account_code: acc.code,
        account_name: acc.name,
        debit: acc.debit,
        credit: acc.credit,
        balance
      });
    }

    // Sort by account code
    data.sort((a, b) => a.account_code.localeCompare(b.account_code));

    return {
      title: 'Trial Balance',
      columns: [
        { header: 'Account Code', key: 'account_code' },
        { header: 'Account Name', key: 'account_name' },
        { header: 'Debit', key: 'debit', type: 'currency' },
        { header: 'Credit', key: 'credit', type: 'currency' },
        { header: 'Balance', key: 'balance', type: 'currency' }
      ],
      data,
      totals: { debit: totalDebit, credit: totalCredit }
    };
  }

  async getProfitAndLoss(filters: ReportFilterDto): Promise<ReportResultDto> {
    const whereCondition: any = {
      journal_entry: { company_id: filters.company_id, status: 'Posted' }
    };
    if (filters.start_date || filters.end_date) {
      whereCondition.journal_entry.journal_date = {};
      if (filters.start_date) whereCondition.journal_entry.journal_date.gte = new Date(filters.start_date);
      if (filters.end_date) whereCondition.journal_entry.journal_date.lte = new Date(filters.end_date);
    }

    const items = await this.prisma.journalEntryItem.findMany({
      where: whereCondition,
      include: { account: { include: { account_type: true } } }
    });

    let revenue = 0;
    let cogs = 0;
    let expenses = 0;
    let otherIncome = 0;
    let otherExpenses = 0;

    items.forEach(item => {
      const type = item.account.account_type.code.toUpperCase();
      const amount = item.credit - item.debit; // revenue/equity normal is credit
      const expAmount = item.debit - item.credit; // expense normal is debit
      
      if (type.includes('REVENUE') || type.includes('INCOME')) {
        if (type.includes('OTHER')) otherIncome += amount;
        else revenue += amount;
      } else if (type === 'COGS') {
        cogs += expAmount;
      } else if (type.includes('EXPENSE')) {
        if (type.includes('OTHER')) otherExpenses += expAmount;
        else expenses += expAmount;
      }
    });

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses + otherIncome - otherExpenses;

    return {
      title: 'Profit & Loss',
      columns: [
        { header: 'Category', key: 'category' },
        { header: 'Amount', key: 'amount', type: 'currency' }
      ],
      data: [
        { category: 'Revenue', amount: revenue },
        { category: 'Cost of Goods Sold', amount: cogs },
        { category: 'Gross Profit', amount: grossProfit },
        { category: 'Operating Expenses', amount: expenses },
        { category: 'Other Income', amount: otherIncome },
        { category: 'Other Expenses', amount: otherExpenses },
        { category: 'Net Profit', amount: netProfit }
      ],
      totals: { amount: netProfit }
    };
  }

  async getBalanceSheet(filters: ReportFilterDto): Promise<ReportResultDto> {
    const items = await this.prisma.journalEntryItem.findMany({
      where: {
        journal_entry: { company_id: filters.company_id, status: 'Posted' },
        ...(filters.end_date ? { journal_entry: { journal_date: { lte: new Date(filters.end_date) } } } : {})
      },
      include: { account: { include: { account_type: true } } }
    });

    let assets = 0;
    let liabilities = 0;
    let equity = 0;
    
    let revenue = 0;
    let cogs = 0;
    let expenses = 0;

    items.forEach(item => {
      const type = item.account.account_type.code.toUpperCase();
      const debitBal = item.debit - item.credit;
      const creditBal = item.credit - item.debit;

      if (type.includes('ASSET')) assets += debitBal;
      else if (type.includes('LIABILIT')) liabilities += creditBal;
      else if (type.includes('EQUITY')) equity += creditBal;
      else if (type.includes('REVENUE') || type.includes('INCOME')) revenue += creditBal;
      else if (type === 'COGS') cogs += debitBal;
      else if (type.includes('EXPENSE')) expenses += debitBal;
    });

    // Retained Earnings from P&L is added to Equity
    equity += (revenue - cogs - expenses);

    return {
      title: 'Balance Sheet',
      columns: [
        { header: 'Category', key: 'category' },
        { header: 'Amount', key: 'amount', type: 'currency' }
      ],
      data: [
        { category: 'Assets', amount: assets },
        { category: 'Liabilities', amount: liabilities },
        { category: 'Equity (Including Retained Earnings)', amount: equity }
      ]
    };
  }
}

