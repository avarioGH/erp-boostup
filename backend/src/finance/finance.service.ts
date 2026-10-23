import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GlService } from '../gl/gl.service';

export interface FinanceTransactionDto {
  companyId: string;
  cashAccountId: string;
  transactionNo: string;
  transactionDate: Date;
  description?: string;
  amount: number;
  categoryId: string; // for simplicity, one category per transaction
  userId: string;
  // For GL double entry mapping:
  debitAccountId: string;
  creditAccountId: string;
}

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private glService: GlService,
  ) {}

  async getCategories(companyId: string) {
    let categories = await this.prisma.financeCategory.findMany({
      where: { company_id: companyId },
      orderBy: { name: 'asc' },
    });

    if (categories.length === 0) {
      const defaultCategories = [
        { name: 'Gaji Karyawan', type: 'EXPENSE' },
        { name: 'Listrik, Air & Internet', type: 'EXPENSE' },
        { name: 'Pembayaran / Beli Ikan (Suplier)', type: 'EXPENSE' },
        { name: 'Operasional Gudang & Logistik', type: 'EXPENSE' },
        { name: 'Bahan Bakar & Transportasi', type: 'EXPENSE' },
        { name: 'Perawatan & Servis Mesin', type: 'EXPENSE' },
        { name: 'Konsumsi & Perlengkapan Kantor', type: 'EXPENSE' },
        { name: 'Pengeluaran Lain-lain', type: 'EXPENSE' },
        { name: 'Penjualan Ikan & Seafood', type: 'INCOME' },
        { name: 'Pendapatan Jasa / Cold Storage', type: 'INCOME' },
        { name: 'Pemasukan Lain-lain', type: 'INCOME' },
      ];

      for (const item of defaultCategories) {
        await this.prisma.financeCategory.create({
          data: {
            company_id: companyId,
            name: item.name,
            type: item.type,
          },
        });
      }

      categories = await this.prisma.financeCategory.findMany({
        where: { company_id: companyId },
        orderBy: { name: 'asc' },
      });
    }

    return categories;
  }

  async createCashIn(data: FinanceTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      // Auto-resolve missing accounts
      let cashAccountId = data.cashAccountId;
      if (!cashAccountId) {
        let account = await tx.cashAccount.findFirst({
          where: { company_id: data.companyId, name: 'Kas Utama' },
        });
        if (!account) {
          account = await tx.cashAccount.create({
            data: {
              company_id: data.companyId,
              code: 'CASH-001',
              name: 'Kas Utama',
              account_type: 'Cash',
            },
          });
        }
        cashAccountId = account.id;
      }

      let catId = data.categoryId;
      if (!catId) {
        let cat = await tx.financeCategory.findFirst({
          where: { company_id: data.companyId, type: 'INCOME' },
        });
        if (!cat)
          cat = await tx.financeCategory.create({
            data: {
              company_id: data.companyId,
              name: 'Pemasukan Lain-lain',
              type: 'INCOME',
            },
          });
        catId = cat.id;
      }

      // 1. Create Immutable Transaction Header & Item
      const transaction = await tx.financeTransaction.create({
        data: {
          company_id: data.companyId,
          transaction_no: data.transactionNo,
          transaction_type: 'Cash In',
          cash_account_id: cashAccountId,
          transaction_date: data.transactionDate,
          status: 'Approved',
          description: data.description,
          total_amount: data.amount,
          created_by: data.userId,
          approved_by: data.userId,
          approved_at: new Date(),
          items: {
            create: [
              {
                category_id: catId,
                amount: data.amount,
                description: data.description,
              },
            ],
          },
        },
      });

      // 2. Update Cash Account Balance
      await tx.cashAccount.update({
        where: { id: cashAccountId },
        data: { current_balance: { increment: data.amount } },
      });

      // 3. GL Double Entry (optional/graceful)
      const accountRecord = await tx.cashAccount.findUnique({
        where: { id: cashAccountId },
      });
      const debitId = data.debitAccountId || accountRecord?.chart_of_account_id;
      const creditId = data.creditAccountId;

      if (debitId && creditId) {
        try {
          await this.glService.createJournalEntryWithinTx(tx as any, {
            companyId: data.companyId,
            entryDate: data.transactionDate,
            referenceType: 'FINANCE',
            referenceId: transaction.id,
            description: `Cash In: ${data.description || 'Penerimaan Kas'}`,
            items: [
              { accountId: debitId, debit: data.amount, credit: 0 },
              { accountId: creditId, debit: 0, credit: data.amount },
            ],
          });
        } catch (e) {
          console.warn('GL Journal entry skipped for Cash In:', e);
        }
      }

      return transaction;
    });
  }

  async createCashOut(data: FinanceTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      // Auto-resolve missing accounts
      let cashAccountId = data.cashAccountId;
      if (!cashAccountId) {
        let account = await tx.cashAccount.findFirst({
          where: { company_id: data.companyId, name: 'Kas Utama' },
        });
        if (!account) {
          account = await tx.cashAccount.create({
            data: {
              company_id: data.companyId,
              code: 'CASH-001',
              name: 'Kas Utama',
              account_type: 'Cash',
            },
          });
        }
        cashAccountId = account.id;
      }

      let catId = data.categoryId;
      if (!catId) {
        let cat = await tx.financeCategory.findFirst({
          where: { company_id: data.companyId, type: 'EXPENSE' },
        });
        if (!cat)
          cat = await tx.financeCategory.create({
            data: {
              company_id: data.companyId,
              name: 'Pengeluaran Lain-lain',
              type: 'EXPENSE',
            },
          });
        catId = cat.id;
      }

      // 1. Create Transaction
      const transaction = await tx.financeTransaction.create({
        data: {
          company_id: data.companyId,
          transaction_no: data.transactionNo,
          transaction_type: 'Cash Out',
          cash_account_id: cashAccountId,
          transaction_date: data.transactionDate,
          status: 'Approved',
          description: data.description,
          total_amount: data.amount,
          created_by: data.userId,
          approved_by: data.userId,
          approved_at: new Date(),
          items: {
            create: [
              {
                category_id: catId,
                amount: data.amount,
                description: data.description,
              },
            ],
          },
        },
      });

      // 2. Update Cash Account Balance
      await tx.cashAccount.update({
        where: { id: cashAccountId },
        data: { current_balance: { decrement: data.amount } },
      });

      // 3. GL Double Entry (optional/graceful)
      const accountRecord = await tx.cashAccount.findUnique({
        where: { id: cashAccountId },
      });
      const creditId = data.creditAccountId || accountRecord?.chart_of_account_id;
      const debitId = data.debitAccountId;

      if (debitId && creditId) {
        try {
          await this.glService.createJournalEntryWithinTx(tx as any, {
            companyId: data.companyId,
            entryDate: data.transactionDate,
            referenceType: 'FINANCE',
            referenceId: transaction.id,
            description: `Cash Out: ${data.description || 'Pengeluaran Kas'}`,
            items: [
              { accountId: debitId, debit: data.amount, credit: 0 },
              { accountId: creditId, debit: 0, credit: data.amount },
            ],
          });
        } catch (e) {
          console.warn('GL Journal entry skipped for Cash Out:', e);
        }
      }

      return transaction;
    });
  }

  async reverseTransaction(
    originalTxId: string,
    userId: string,
    reverseTxNo: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const originalTx = await tx.financeTransaction.findUnique({
        where: { id: originalTxId },
        include: { items: true },
      });

      if (!originalTx || originalTx.status !== 'Approved') {
        throw new BadRequestException('Can only reverse approved transactions');
      }

      // 1. Create Reversal Transaction
      const reversalType =
        originalTx.transaction_type === 'Cash In' ? 'Cash Out' : 'Cash In';

      const reversedTx = await tx.financeTransaction.create({
        data: {
          company_id: originalTx.company_id,
          transaction_no: reverseTxNo,
          transaction_type: reversalType,
          cash_account_id: originalTx.cash_account_id,
          reference_type: 'REVERSAL',
          reference_id: originalTx.id,
          transaction_date: new Date(),
          status: 'Reversed', // Flagging as reversed
          description: `Reversal of ${originalTx.transaction_no}`,
          total_amount: originalTx.total_amount,
          created_by: userId,
          approved_by: userId,
          approved_at: new Date(),
          items: {
            create: originalTx.items.map((item) => ({
              category_id: item.category_id,
              amount: item.amount,
              description: `Reversal: ${item.description}`,
            })),
          },
        },
      });

      // 2. Mark Original as Reversed
      await tx.financeTransaction.update({
        where: { id: originalTx.id },
        data: { status: 'Reversed' },
      });

      // Note: A full GL Reversal would also fetch the original JournalEntry and flip Debit/Credit here.
      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          company_id: originalTx.company_id,
          user_id: userId,
          action: 'REVERSE_TRANSACTION',
          entity: 'FinanceTransaction',
          entity_id: reversedTx.id,
          before_data: originalTx as any,
          after_data: reversedTx as any,
        },
      });

      return reversedTx;
    });
  }

  // --- FINANCIAL REPORTS AGGREGATION ---

  async getProfitLossReport(companyId: string, startDate?: Date, endDate?: Date) {
    const whereCondition: any = {
      journal_entry: { company_id: companyId, status: 'Posted' },
    };
    if (startDate || endDate) {
      whereCondition.journal_entry.journal_date = {};
      if (startDate) whereCondition.journal_entry.journal_date.gte = startDate;
      if (endDate) whereCondition.journal_entry.journal_date.lte = endDate;
    }

    const items = await this.prisma.journalEntryItem.findMany({
      where: whereCondition,
      include: { account: { include: { account_type: true } } },
    });

    const categories = {
      revenue: new Map<string, number>(),
      contraRevenue: new Map<string, number>(),
      cogs: new Map<string, number>(),
      operatingExpenses: new Map<string, number>(),
      otherIncome: new Map<string, number>(),
      otherExpenses: new Map<string, number>(),
    };

    let totalRevenue = 0;
    let totalContraRevenue = 0;
    let totalCogs = 0;
    let totalOperatingExpenses = 0;
    let totalOtherIncome = 0;
    let totalOtherExpenses = 0;

    items.forEach((item) => {
      const typeCode = item.account.account_type.code.toUpperCase();
      const accountName = item.account.account_name;
      const creditBal = item.credit - item.debit;
      const debitBal = item.debit - item.credit;

      if (typeCode.includes('REVENUE') || typeCode.includes('INCOME')) {
        if (typeCode.includes('CONTRA') || accountName.toUpperCase().includes('RETURN') || accountName.toUpperCase().includes('RETUR') || accountName.toUpperCase().includes('DISCOUNT')) {
          categories.contraRevenue.set(accountName, (categories.contraRevenue.get(accountName) || 0) + debitBal);
          totalContraRevenue += debitBal;
        } else if (typeCode.includes('OTHER')) {
          categories.otherIncome.set(accountName, (categories.otherIncome.get(accountName) || 0) + creditBal);
          totalOtherIncome += creditBal;
        } else {
          categories.revenue.set(accountName, (categories.revenue.get(accountName) || 0) + creditBal);
          totalRevenue += creditBal;
        }
      } else if (typeCode === 'COGS' || typeCode.includes('COGS')) {
        categories.cogs.set(accountName, (categories.cogs.get(accountName) || 0) + debitBal);
        totalCogs += debitBal;
      } else if (typeCode.includes('EXPENSE')) {
        if (typeCode.includes('OTHER')) {
          categories.otherExpenses.set(accountName, (categories.otherExpenses.get(accountName) || 0) + debitBal);
          totalOtherExpenses += debitBal;
        } else {
          categories.operatingExpenses.set(accountName, (categories.operatingExpenses.get(accountName) || 0) + debitBal);
          totalOperatingExpenses += debitBal;
        }
      }
    });

    const netRevenue = totalRevenue - totalContraRevenue;
    const grossProfit = netRevenue - totalCogs;
    const netProfit = grossProfit - totalOperatingExpenses + totalOtherIncome - totalOtherExpenses;

    const mapToArray = (map: Map<string, number>) => Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));

    return {
      revenue: mapToArray(categories.revenue),
      contraRevenue: mapToArray(categories.contraRevenue),
      cogs: mapToArray(categories.cogs),
      expenses: mapToArray(categories.operatingExpenses), // for backward compatibility
      operatingExpenses: mapToArray(categories.operatingExpenses),
      otherIncome: mapToArray(categories.otherIncome),
      otherExpenses: mapToArray(categories.otherExpenses),

      totalRevenue,
      totalContraRevenue,
      netRevenue,
      totalCogs,
      grossProfit,
      totalExpenses: totalOperatingExpenses + totalOtherExpenses, // backward compatibility
      totalOperatingExpenses,
      totalOtherIncome,
      totalOtherExpenses,
      netProfit,
    };
  }

  async getCashFlowReport(companyId: string) {
    const transactions = await this.prisma.financeTransaction.findMany({
      where: {
        company_id: companyId,
        status: { in: ['Approved', 'COMPLETED'] },
      },
      orderBy: { transaction_date: 'asc' },
    });

    let totalInflow = 0;
    let totalOutflow = 0;
    const cashInflows: any[] = [];
    const cashOutflows: any[] = [];

    for (const tx of transactions) {
      const val = Number(tx.total_amount);
      if (
        tx.transaction_type === 'Cash In' ||
        tx.transaction_type === 'Income'
      ) {
        totalInflow += val;
        cashInflows.push({
          date: tx.transaction_date,
          description: tx.description || 'Penerimaan',
          amount: val,
        });
      } else if (
        tx.transaction_type === 'Cash Out' ||
        tx.transaction_type === 'Expense'
      ) {
        totalOutflow += val;
        cashOutflows.push({
          date: tx.transaction_date,
          description: tx.description || 'Pengeluaran',
          amount: val,
        });
      }
    }

    return {
      cashInflows,
      cashOutflows,
      totalInflow,
      totalOutflow,
      netCashFlow: totalInflow - totalOutflow,
    };
  }

  async getBalanceSheetReport(companyId: string) {
    // 1. Calculate Cash Balance
    const cashAccounts = await this.prisma.cashAccount.findMany({
      where: { company_id: companyId },
    });
    const totalCash = cashAccounts.reduce(
      (sum, acc) => sum + Number(acc.current_balance),
      0,
    );

    // 2. Calculate Inventory Value
    const stocks = await this.prisma.warehouseStock.findMany({
      where: { company_id: companyId },
      include: { product: true },
    });
    const inventoryValue = stocks.reduce(
      (sum, stock) =>
        sum + stock.current_stock * Number(stock.product.purchase_price),
      0,
    );

    // 3. Asset Master Value (If Asset module is active)
    const fixedAssets = await this.prisma.assetMaster.findMany({
      where: { company_id: companyId },
    });
    const fixedAssetValue = fixedAssets.reduce(
      (sum, asset) => sum + Number(asset.purchase_price),
      0,
    );

    const totalAssets = totalCash + inventoryValue + fixedAssetValue;

    // For MVP, Liabilities = 0, Equity = Assets - Liabilities
    const totalLiabilities = 0;
    const totalEquity = totalAssets;

    return {
      assets: [
        { name: 'Kas & Bank', amount: totalCash },
        { name: 'Persediaan Barang', amount: inventoryValue },
        { name: 'Aset Tetap', amount: fixedAssetValue },
      ],
      liabilities: [{ name: 'Hutang Dagang', amount: 0 }],
      equity: [{ name: 'Modal Pemilik', amount: totalEquity }],
      totalAssets,
      totalLiabilities,
      totalEquity,
    };
  }

  async getCashReconciliation(companyId: string) {
    const cashAccounts = await this.prisma.cashAccount.findMany({
      where: { company_id: companyId },
      include: { chart_of_account: { include: { account_type: true } } },
    });

    const results: any[] = [];

    for (const ca of cashAccounts) {
      const operationalBalance = ca.current_balance;

      if (!ca.chart_of_account_id) {
        results.push({
          cash_account_id: ca.id,
          mapped_coa: null,
          operational_balance: operationalBalance,
          gl_balance: null,
          difference: null,
          status: 'UNMAPPED',
        });
        continue;
      }

      // Calculate GL Balance
      const glItems = await this.prisma.journalEntryItem.aggregate({
        where: {
          account_id: ca.chart_of_account_id,
          journal_entry: {
            company_id: companyId,
            status: { in: ['Posted', 'Reversed'] },
          },
        },
        _sum: { debit: true, credit: true },
      });

      const debit = glItems._sum.debit || 0;
      const credit = glItems._sum.credit || 0;
      let glBalance = debit - credit;
      if (ca.chart_of_account?.account_type?.normal_balance === 'Credit') {
        glBalance = credit - debit;
      }
      glBalance += Number(ca.opening_balance || 0);

      const difference = operationalBalance - glBalance;

      let status = 'MATCHED';
      if (Math.abs(difference) > 0.0001) status = 'MISMATCH';

      results.push({
        cash_account_id: ca.id,
        mapped_coa: ca.chart_of_account?.account_name || null,
        operational_balance: operationalBalance,
        gl_balance: glBalance,
        difference: difference,
        status: status,
      });
    }

    return results;
  }
}
