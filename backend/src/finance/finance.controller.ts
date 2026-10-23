import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FinanceService, FinanceTransactionDto } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Permissions('finance.category.view')
  @Get('categories')
  async getCategories(@Request() req) {
    return this.financeService.getCategories(req.user.company_id);
  }

  @Permissions('finance.create')
  @Post('categories')
  async createCategory(@Request() req, @Body() data: any) {
    if (!data.name) {
      throw new BadRequestException('Nama kategori harus diisi');
    }
    return this.prisma.financeCategory.create({
      data: {
        company_id: req.user.company_id,
        name: data.name,
        type: data.type || 'EXPENSE',
        color: data.color || null,
        icon: data.icon || null,
      },
    });
  }

  @Permissions('finance.edit')
  @Put('categories/:id')
  async updateCategory(
    @Request() req,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.prisma.financeCategory.updateMany({
      where: { id, company_id: req.user.company_id },
      data: {
        name: data.name,
        type: data.type,
        color: data.color,
        icon: data.icon,
      },
    });
  }

  @Permissions('finance.delete')
  @Delete('categories/:id')
  async deleteCategory(@Request() req, @Param('id') id: string) {
    return this.prisma.financeCategory.deleteMany({
      where: { id, company_id: req.user.company_id },
    });
  }

  @Permissions('finance.view')
  @Get('summary')
  async getSummary(@Request() req) {
    const companyId = req.user.company_id;
    // 1. Total Cash from all Cash Accounts
    let cashAccounts = await this.prisma.cashAccount.findMany({
      where: { company_id: companyId },
      orderBy: { code: 'asc' },
    });

    if (cashAccounts.length === 0) {
      const defaults = [
        { code: 'KAS-01', name: 'Kasir POS (Retail)', account_type: 'Cash' },
        { code: 'KAS-02', name: 'Kas Pembelian Ikan (Nelayan)', account_type: 'Cash' },
        { code: 'KAS-03', name: 'Alokasi Gaji & Karyawan', account_type: 'Cash' },
        { code: 'KAS-04', name: 'Operasional Gudang & Cold Storage', account_type: 'Cash' },
        { code: 'BANK-01', name: 'Bank & Kas Utama', account_type: 'Bank' },
      ];
      for (const d of defaults) {
        await this.prisma.cashAccount.create({
          data: {
            company_id: companyId,
            code: d.code,
            name: d.name,
            account_type: d.account_type,
            opening_balance: 0,
            current_balance: 0,
          },
        }).catch(() => {});
      }
      cashAccounts = await this.prisma.cashAccount.findMany({
        where: { company_id: companyId },
        orderBy: { code: 'asc' },
      });
    }

    const totalCash = cashAccounts.reduce(
      (sum, acc) => sum + Number(acc.current_balance),
      0,
    );

    // 2. Month-to-Date (MTD) calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Previous Month calculations
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const transactions = await this.prisma.financeTransaction.findMany({
      where: {
        company_id: companyId,
        transaction_date: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago for chart
        },
        status: {
          in: ['Approved', 'COMPLETED'],
        },
      },
      include: {
        items: {
          include: {
            category: true,
          },
        },
      },
    });

    let totalIncomeMtd = 0;
    let totalExpensesMtd = 0;
    let totalIncomeLastMonth = 0;
    let totalExpensesLastMonth = 0;

    // Category breakdown for expenses
    const categoryExpenseMap = new Map<
      string,
      { categoryId: string; categoryName: string; amount: number; count: number }
    >();

    // Chart Data Generation (Last 30 days)
    const chartMap = new Map<
      string,
      { date: string; income: number; expenses: number }
    >();

    let iterateDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    while (iterateDate <= now) {
      const dateKey = `${iterateDate.getDate().toString().padStart(2, '0')}/${(iterateDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!chartMap.has(dateKey)) {
        chartMap.set(dateKey, { date: dateKey, income: 0, expenses: 0 });
      }
      iterateDate.setDate(iterateDate.getDate() + 1);
    }

    for (const tx of transactions) {
      const isIncome =
        tx.transaction_type === 'Cash In' || tx.transaction_type === 'Income';
      const val = Number(tx.total_amount);
      const txDate = new Date(tx.transaction_date);

      // MTD Check
      if (txDate >= startOfMonth) {
        if (isIncome) {
          totalIncomeMtd += val;
        } else {
          totalExpensesMtd += val;
          // Track expense category breakdown
          const catName = tx.items?.[0]?.category?.name || 'Lain-lain / Operasional';
          const catId = tx.items?.[0]?.category_id || 'unknown';
          const existing = categoryExpenseMap.get(catName) || {
            categoryId: catId,
            categoryName: catName,
            amount: 0,
            count: 0,
          };
          existing.amount += val;
          existing.count += 1;
          categoryExpenseMap.set(catName, existing);
        }
      }
      // Last Month Check
      else if (txDate >= startOfLastMonth && txDate <= endOfLastMonth) {
        if (isIncome) totalIncomeLastMonth += val;
        else totalExpensesLastMonth += val;
      }

      // Chart Data
      const dateKey = `${txDate.getDate().toString().padStart(2, '0')}/${(txDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (chartMap.has(dateKey)) {
        const point = chartMap.get(dateKey)!;
        if (isIncome) point.income += val;
        else point.expenses += val;
      }
    }

    const netProfitMtd = totalIncomeMtd - totalExpensesMtd;
    const netProfitLastMonth = totalIncomeLastMonth - totalExpensesLastMonth;

    // Cash Last Month approximation (Current Cash - Net Profit MTD)
    const totalCashLastMonth = totalCash - netProfitMtd;

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / Math.abs(previous)) * 100;
    };

    const incomeGrowth = calculateGrowth(totalIncomeMtd, totalIncomeLastMonth);
    const expensesGrowth = calculateGrowth(
      totalExpensesMtd,
      totalExpensesLastMonth,
    );
    const profitGrowth = calculateGrowth(netProfitMtd, netProfitLastMonth);
    const cashGrowth = calculateGrowth(totalCash, totalCashLastMonth);

    const chartData = Array.from(chartMap.values()).sort((a, b) => {
      const [dayA, monthA] = a.date.split('/');
      const [dayB, monthB] = b.date.split('/');
      if (monthA !== monthB) return Number(monthA) - Number(monthB);
      return Number(dayA) - Number(dayB);
    });

    const expenseCategories = Array.from(categoryExpenseMap.values()).sort(
      (a, b) => b.amount - a.amount,
    );

    return {
      totalCash,
      cashGrowth,
      totalIncomeMtd,
      incomeGrowth,
      totalExpensesMtd,
      expensesGrowth,
      netProfitMtd,
      profitGrowth,
      chartData,
      cashAccounts,
      expenseCategories,
    };
  }

  @Permissions('finance.view')
  @Get('transactions')
  async getTransactions(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const where: any = { company_id: req.user.company_id };

    if (startDate || endDate) {
      where.transaction_date = {};
      if (startDate) {
        where.transaction_date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.transaction_date.lte = end;
      }
    }

    if (type && type !== 'ALL') {
      if (type === 'IN') {
        where.transaction_type = { in: ['Cash In', 'Income'] };
      } else if (type === 'OUT') {
        where.transaction_type = { in: ['Cash Out', 'Expense'] };
      } else {
        where.transaction_type = type;
      }
    }

    if (categoryId && categoryId !== 'ALL') {
      where.items = {
        some: {
          category_id: categoryId,
        },
      };
    }

    return this.prisma.financeTransaction.findMany({
      where,
      orderBy: { transaction_date: 'desc' },
      take: 200,
      include: {
        cash_account: true,
        user_created: { select: { name: true } },
        items: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  @Permissions('finance.create')
  @Post('cash-in')
  async createCashIn(@Request() req, @Body() data: any) {
    const dto: FinanceTransactionDto = {
      companyId: req.user.company_id,
      userId: req.user.userId,
      transactionNo: data.transactionNo || `CI-${Date.now()}`,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : new Date(),
      amount: Number(data.amount),
      description: data.description,
      cashAccountId: data.cashAccountId,
      categoryId: data.categoryId,
      debitAccountId: data.debitAccountId,
      creditAccountId: data.creditAccountId,
    };
    return this.financeService.createCashIn(dto);
  }

  @Permissions('finance.create')
  @Post('cash-out')
  async createCashOut(@Request() req, @Body() data: any) {
    const dto: FinanceTransactionDto = {
      companyId: req.user.company_id,
      userId: req.user.userId,
      transactionNo: data.transactionNo || `CO-${Date.now()}`,
      transactionDate: data.transactionDate
        ? new Date(data.transactionDate)
        : new Date(),
      amount: Number(data.amount),
      description: data.description,
      cashAccountId: data.cashAccountId,
      categoryId: data.categoryId,
      debitAccountId: data.debitAccountId,
      creditAccountId: data.creditAccountId,
    };
    return this.financeService.createCashOut(dto);
  }
  @Permissions('finance.view')
  @Get('reports/profit-loss')
  async getProfitLossReport(@Request() req) {
    return this.financeService.getProfitLossReport(req.user.company_id);
  }

  @Permissions('finance.view')
  @Get('reports/cash-flow')
  async getCashFlowReport(@Request() req) {
    return this.financeService.getCashFlowReport(req.user.company_id);
  }

  @Permissions('finance.view')
  @Get('reports/balance-sheet')
  async getBalanceSheetReport(@Request() req) {
    return this.financeService.getBalanceSheetReport(req.user.company_id);
  }

  @Permissions('finance.view')
  @Get('cash-reconciliation')
  async getCashReconciliation(@Request() req: any) {
    return this.financeService.getCashReconciliation(req.user.company_id);
  }
}
