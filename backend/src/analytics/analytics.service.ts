import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSalesAnalytics(companyId: string, startDate?: string, endDate?: string) {
    const whereClause: any = { company_id: companyId, status: { notIn: ['CANCELLED', 'DRAFT'] } };
    if (startDate && endDate) {
       whereClause.created_at = { gte: new Date(startDate), lt: new Date(endDate) };
    }

    const aggregations = await this.prisma.salesOrder.aggregate({
      where: whereClause,
      _sum: { total_amount: true },
      _count: { id: true },
      _avg: { total_amount: true }
    });

    // Quotation Conversion Rate
    const totalQuotations = await this.prisma.quotation.count({ where: { company_id: companyId } });
    const convertedQuotations = await this.prisma.quotation.count({ where: { company_id: companyId, status: 'CONFIRMED' } });
    const quotationConversionRate = totalQuotations > 0 ? (convertedQuotations / totalQuotations) * 100 : 0;

    return {
      revenue: aggregations._sum.total_amount || 0,
      numberOfOrders: aggregations._count.id || 0,
      averageOrderValue: aggregations._avg.total_amount || 0,
      quotationConversionRate
    };
  }

  async getCustomerAnalytics(companyId: string) {
    const totalCustomers = await this.prisma.customer.count({ where: { company_id: companyId } });
    
    // Customers who have placed at least one order
    const customersWithOrders = await this.prisma.salesOrder.groupBy({
      by: ['customer_id'],
      where: { company_id: companyId, status: { notIn: ['CANCELLED'] } },
    });
    
    const activeCustomers = customersWithOrders.length;
    
    // LTV Calculation (Average total revenue per customer)
    const salesAgg = await this.prisma.salesOrder.aggregate({
       where: { company_id: companyId, status: { notIn: ['CANCELLED'] } },
       _sum: { total_amount: true }
    });
    const totalRevenue = salesAgg._sum.total_amount || 0;
    const ltv = activeCustomers > 0 ? totalRevenue / activeCustomers : 0;

    return {
      totalCustomers,
      activeCustomers,
      customerLifetimeRevenue: ltv
    };
  }

  async getPipelineAnalytics(companyId: string) {
    const opportunities = await this.prisma.opportunity.findMany({
      where: { company_id: companyId }
    });

    let totalValue = 0;
    let weightedValue = 0;
    let wonValue = 0;
    let wonCount = 0;
    let totalCount = opportunities.length;

    opportunities.forEach(opp => {
       totalValue += opp.expected_value;
       weightedValue += (opp.expected_value * (opp.probability / 100));
       if (opp.stage === 'WON') {
          wonValue += opp.expected_value;
          wonCount++;
       }
    });

    const winRate = totalCount > 0 ? (wonCount / totalCount) * 100 : 0;

    return {
      openOpportunities: totalCount,
      pipelineValue: totalValue,
      weightedPipeline: weightedValue,
      winRate
    };
  }

  async getFinancialAnalytics(companyId: string) {
    // Leveraging GL Architecture strictly.
    const revenueAccountIds = (await this.prisma.chartOfAccount.findMany({
      where: { company_id: companyId, account_type: { code: 'REVENUE' } }
    })).map(a => a.id);

    const expenseAccountIds = (await this.prisma.chartOfAccount.findMany({
      where: { company_id: companyId, account_type: { code: 'EXPENSE' } }
    })).map(a => a.id);

    const revEntries = await this.prisma.journalEntryItem.aggregate({
      where: { account_id: { in: revenueAccountIds }, journal_entry: { company_id: companyId } },
      _sum: { credit: true, debit: true }
    });
    const expEntries = await this.prisma.journalEntryItem.aggregate({
      where: { account_id: { in: expenseAccountIds }, journal_entry: { company_id: companyId } },
      _sum: { debit: true, credit: true }
    });

    const totalRevenue = (revEntries._sum?.credit || 0) - (revEntries._sum?.debit || 0);
    const totalExpenses = (expEntries._sum?.debit || 0) - (expEntries._sum?.credit || 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
    };
  }
}
