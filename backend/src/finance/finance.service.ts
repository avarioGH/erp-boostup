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
    private glService: GlService
  ) {}

  async getCategories(companyId: string) {
    return this.prisma.financeCategory.findMany({
      where: { company_id: companyId },
      orderBy: { name: 'asc' }
    });
  }

  async createCashIn(data: FinanceTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      // Auto-resolve missing accounts
      let cashAccountId = data.cashAccountId;
      if (!cashAccountId) {
        let account = await tx.cashAccount.findFirst({ where: { company_id: data.companyId, name: 'Kas Utama' } });
        if (!account) {
          account = await tx.cashAccount.create({ data: { company_id: data.companyId, code: 'CASH-001', name: 'Kas Utama', account_type: 'Cash' } });
        }
        cashAccountId = account.id;
      }

      let debitId = data.debitAccountId;
      let creditId = data.creditAccountId;
      if (!debitId || !creditId) {
        // GL Posting is skipped if accounts are not provided to avoid complex schema dependency here
      }
      
      let catId = data.categoryId;
      if (!catId) {
        let cat = await tx.financeCategory.findFirst({ where: { company_id: data.companyId, name: 'General' } });
        if (!cat) cat = await tx.financeCategory.create({ data: { company_id: data.companyId, name: 'General', type: 'INCOME' } });
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
          status: 'Approved', // Langsung approved untuk demo immutable
          description: data.description,
          total_amount: data.amount,
          created_by: data.userId,
          approved_by: data.userId,
          approved_at: new Date(),
          items: {
            create: [{
              category_id: catId,
              amount: data.amount,
              description: data.description,
            }]
          }
        },
      });

      // 2. Update Cash Account Balance
      await tx.cashAccount.update({
        where: { id: cashAccountId },
        data: { current_balance: { increment: data.amount } }
      });

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          company_id: data.companyId,
          user_id: data.userId,
          action: 'CREATE_APPROVED',
          entity: 'FinanceTransaction_CashIn',
          entity_id: transaction.id,
        }
      });

      // 4. Generate GL Double Entry
      if (debitId && creditId) {
        await this.glService.createJournalEntryWithinTx(tx as any, {
          companyId: data.companyId,
          entryDate: data.transactionDate,
          referenceType: 'FINANCE',
          referenceId: transaction.id,
          description: `Cash In: ${data.description}`,
          items: [
            { accountId: debitId, debit: data.amount, credit: 0 },
            { accountId: creditId, debit: 0, credit: data.amount },
          ]
        });
      }

      return transaction;
    });
  }

  async createCashOut(data: FinanceTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      // Auto-resolve missing accounts
      let cashAccountId = data.cashAccountId;
      if (!cashAccountId) {
        let account = await tx.cashAccount.findFirst({ where: { company_id: data.companyId, name: 'Kas Utama' } });
        if (!account) {
          account = await tx.cashAccount.create({ data: { company_id: data.companyId, code: 'CASH-001', name: 'Kas Utama', account_type: 'Cash' } });
        }
        cashAccountId = account.id;
      }

      let debitId = data.debitAccountId;
      let creditId = data.creditAccountId;
      if (!debitId || !creditId) {
        // GL Posting is skipped if accounts are not provided
      }
      
      let catId = data.categoryId;
      if (!catId) {
        let cat = await tx.financeCategory.findFirst({ where: { company_id: data.companyId, name: 'General Expense' } });
        if (!cat) cat = await tx.financeCategory.create({ data: { company_id: data.companyId, name: 'General Expense', type: 'EXPENSE' } });
        catId = cat.id;
      }

      // Validasi Saldo
      const account = await tx.cashAccount.findUnique({ where: { id: cashAccountId } });
      if (!account || Number(account.current_balance) < data.amount) {
        throw new BadRequestException('Insufficient balance in Cash Account');
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
            create: [{
              category_id: catId,
              amount: data.amount,
              description: data.description,
            }]
          }
        },
      });

      // 2. Update Cash Account Balance (Decrement)
      await tx.cashAccount.update({
        where: { id: cashAccountId },
        data: { current_balance: { decrement: data.amount } }
      });

      // 3. GL Double Entry
      if (debitId && creditId) {
        await this.glService.createJournalEntryWithinTx(tx as any, {
          companyId: data.companyId,
          entryDate: data.transactionDate,
          referenceType: 'FINANCE',
          referenceId: transaction.id,
          description: `Cash Out: ${data.description}`,
          items: [
            { accountId: debitId, debit: data.amount, credit: 0 },
            { accountId: creditId, debit: 0, credit: data.amount },
          ]
        });
      }

      return transaction;
    });
  }

  async reverseTransaction(originalTxId: string, userId: string, reverseTxNo: string) {
    return this.prisma.$transaction(async (tx) => {
      const originalTx = await tx.financeTransaction.findUnique({ 
        where: { id: originalTxId },
        include: { items: true }
      });

      if (!originalTx || originalTx.status !== 'Approved') {
        throw new BadRequestException('Can only reverse approved transactions');
      }

      // 1. Create Reversal Transaction
      const reversalType = originalTx.transaction_type === 'Cash In' ? 'Cash Out' : 'Cash In';
      
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
            create: originalTx.items.map(item => ({
              category_id: item.category_id,
              amount: item.amount,
              description: `Reversal: ${item.description}`,
            }))
          }
        }
      });

      // 2. Mark Original as Reversed
      await tx.financeTransaction.update({
        where: { id: originalTx.id },
        data: { status: 'Reversed' }
      });

      // 3. Revert Account Balance
      const amount = Number(originalTx.total_amount);
      if (originalTx.transaction_type === 'Cash In') {
        await tx.cashAccount.update({
          where: { id: originalTx.cash_account_id },
          data: { current_balance: { decrement: amount } }
        });
      } else {
        await tx.cashAccount.update({
          where: { id: originalTx.cash_account_id },
          data: { current_balance: { increment: amount } }
        });
      }

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
        }
      });

      return reversedTx;
    });
  }

  // --- FINANCIAL REPORTS AGGREGATION ---

  async getProfitLossReport(companyId: string) {
    const transactions = await this.prisma.financeTransaction.findMany({
      where: {
        company_id: companyId,
        status: { in: ['Approved', 'COMPLETED'] }
      },
      include: { items: { include: { category: true } } }
    });

    const incomeMap = new Map<string, number>();
    const expenseMap = new Map<string, number>();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.transaction_type === 'Cash In' || tx.transaction_type === 'Income') {
        for (const item of tx.items) {
          const val = Number(item.amount);
          const catName = item.category ? item.category.name : 'Lainnya';
          totalIncome += val;
          incomeMap.set(catName, (incomeMap.get(catName) || 0) + val);
        }
      } else if (tx.transaction_type === 'Cash Out' || tx.transaction_type === 'Expense') {
        for (const item of tx.items) {
          const val = Number(item.amount);
          const catName = item.category ? item.category.name : 'Lainnya';
          totalExpense += val;
          expenseMap.set(catName, (expenseMap.get(catName) || 0) + val);
        }
      }
    }

    return {
      revenue: Array.from(incomeMap.entries()).map(([name, amount]) => ({ name, amount })),
      expenses: Array.from(expenseMap.entries()).map(([name, amount]) => ({ name, amount })),
      totalRevenue: totalIncome,
      totalExpenses: totalExpense,
      netProfit: totalIncome - totalExpense
    };
  }

  async getCashFlowReport(companyId: string) {
    const transactions = await this.prisma.financeTransaction.findMany({
      where: {
        company_id: companyId,
        status: { in: ['Approved', 'COMPLETED'] }
      },
      orderBy: { transaction_date: 'asc' }
    });

    let totalInflow = 0;
    let totalOutflow = 0;
    const cashInflows: any[] = [];
    const cashOutflows: any[] = [];

    for (const tx of transactions) {
      const val = Number(tx.total_amount);
      if (tx.transaction_type === 'Cash In' || tx.transaction_type === 'Income') {
        totalInflow += val;
        cashInflows.push({
          date: tx.transaction_date,
          description: tx.description || 'Penerimaan',
          amount: val
        });
      } else if (tx.transaction_type === 'Cash Out' || tx.transaction_type === 'Expense') {
        totalOutflow += val;
        cashOutflows.push({
          date: tx.transaction_date,
          description: tx.description || 'Pengeluaran',
          amount: val
        });
      }
    }

    return {
      cashInflows,
      cashOutflows,
      totalInflow,
      totalOutflow,
      netCashFlow: totalInflow - totalOutflow
    };
  }

  async getBalanceSheetReport(companyId: string) {
    // 1. Calculate Cash Balance
    const cashAccounts = await this.prisma.cashAccount.findMany({
      where: { company_id: companyId }
    });
    const totalCash = cashAccounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0);

    // 2. Calculate Inventory Value
    const stocks = await this.prisma.warehouseStock.findMany({
      where: { company_id: companyId },
      include: { product: true }
    });
    const inventoryValue = stocks.reduce((sum, stock) => sum + (stock.current_stock * Number(stock.product.purchase_price)), 0);

    // 3. Asset Master Value (If Asset module is active)
    const fixedAssets = await this.prisma.assetMaster.findMany({
      where: { company_id: companyId }
    });
    const fixedAssetValue = fixedAssets.reduce((sum, asset) => sum + Number(asset.purchase_price), 0);

    const totalAssets = totalCash + inventoryValue + fixedAssetValue;
    
    // For MVP, Liabilities = 0, Equity = Assets - Liabilities
    const totalLiabilities = 0;
    const totalEquity = totalAssets;

    return {
      assets: [
        { name: 'Kas & Bank', amount: totalCash },
        { name: 'Persediaan Barang', amount: inventoryValue },
        { name: 'Aset Tetap', amount: fixedAssetValue }
      ],
      liabilities: [
        { name: 'Hutang Dagang', amount: 0 }
      ],
      equity: [
        { name: 'Modal Pemilik', amount: totalEquity }
      ],
      totalAssets,
      totalLiabilities,
      totalEquity
    };
  }
}
