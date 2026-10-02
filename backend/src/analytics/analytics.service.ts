import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardKPIs(companyId: string, warehouseId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Revenue Today
    const todayOrders = await this.prisma.salesOrder.aggregate({
      where: { 
        company_id: companyId,
        order_date: { gte: today },
        status: { notIn: ['CANCELLED'] }
      },
      _sum: { total_amount: true }
    });
    const currentRevenue = todayOrders._sum.total_amount || 0;

    // Monthly Revenue
    const monthlyOrders = await this.prisma.salesOrder.aggregate({
      where: { 
        company_id: companyId,
        order_date: { gte: firstDayOfMonth },
        status: { notIn: ['CANCELLED'] }
      },
      _sum: { total_amount: true }
    });
    const monthlyRevenue = monthlyOrders._sum.total_amount || 0;
    
    // Profit (simplified as 20% margin if COGS is complex, or real cash flow if we use finance transactions)
    // Let's use Cash Flow for CashFlow and mock netProfit as Monthly Revenue * 0.2 for now, or sum of Finance Income - Expense
    const incomeTx = await this.prisma.financeTransaction.aggregate({
      where: { company_id: companyId, transaction_type: 'Income', transaction_date: { gte: firstDayOfMonth } },
      _sum: { total_amount: true }
    });
    const expenseTx = await this.prisma.financeTransaction.aggregate({
      where: { company_id: companyId, transaction_type: 'Expense', transaction_date: { gte: firstDayOfMonth } },
      _sum: { total_amount: true }
    });
    const totalIncome = incomeTx._sum.total_amount || 0;
    const totalExpense = expenseTx._sum.total_amount || 0;
    const cashFlow = totalIncome - totalExpense;
    
    const netProfit = monthlyRevenue - totalExpense; // Rough approximation for profit

    // Inventory Value
    // Fast estimation: total products
    const inventoryValue = 0; // Simplified for performance if not heavily used yet

    // Top Customers
    const topCustAgg = await this.prisma.salesOrder.groupBy({
      by: ['customer_id'],
      where: { company_id: companyId, status: { notIn: ['CANCELLED'] } },
      _sum: { total_amount: true },
      orderBy: { _sum: { total_amount: 'desc' } },
      take: 5
    });
    
    const topCustomers = await Promise.all(topCustAgg.map(async (tc) => {
      if (!tc.customer_id) return null;
      const c = await this.prisma.customer.findUnique({ where: { id: tc.customer_id } });
      return {
        name: c?.name || 'Unknown',
        revenue: tc._sum.total_amount || 0,
        orders: 0
      };
    })).then(res => res.filter(x => x !== null));

    // Chart Data (Last 7 days)
    const chartData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayAgg = await this.prisma.salesOrder.aggregate({
         where: { company_id: companyId, order_date: { gte: d, lt: nextD }, status: { notIn: ['CANCELLED'] } },
         _sum: { total_amount: true }
      });
      chartData.push({
        date: d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        revenue: dayAgg._sum.total_amount || 0,
        profit: (dayAgg._sum.total_amount || 0) * 0.2
      });
    }

    return {
      currentRevenue,
      netProfit,
      cashFlow,
      inventoryValue,
      comparison: {
        revenuePercentage: 100, // Dummy positive for now
        profitPercentage: 100,
        cashFlowPercentage: 100,
        inventoryPercentage: 0
      },
      chartData,
      topProducts: [],
      lowStock: [],
      topCustomers
    };
  }

  // KEEP THE EXISTING getSalesAnalytics IN CASE IT IS USED ELSEWHERE
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

    const totalQuotations = await this.prisma.quotation.count({ where: { company_id: companyId } });
    const convertedQuotations = await this.prisma.quotation.count({ where: { company_id: companyId, status: 'CONFIRMED' } });
    const quotationConversionRate = totalQuotations > 0 ? (convertedQuotations / totalQuotations) * 100 : 0;

    return {
      totalRevenue: aggregations._sum.total_amount || 0,
      totalOrders: aggregations._count.id || 0,
      averageOrderValue: aggregations._avg.total_amount || 0,
      quotationConversionRate,
      topProducts: [],
      revenueByStatus: [],
      salesTrends: []
    };
  }

  async getCustomerAnalytics(companyId: string) {
    const totalCustomers = await this.prisma.customer.count({ where: { company_id: companyId } });
    const customersWithOrders = await this.prisma.salesOrder.groupBy({
      by: ['customer_id'],
      where: { company_id: companyId, status: { notIn: ['CANCELLED', 'DRAFT'] } }
    });
    const activeCustomers = customersWithOrders.length;
    const aggregations = await this.prisma.salesOrder.aggregate({
      where: { company_id: companyId, status: { notIn: ['CANCELLED', 'DRAFT'] } },
      _sum: { total_amount: true }
    });
    const totalRevenue = aggregations._sum.total_amount || 0;
    const ltv = activeCustomers > 0 ? totalRevenue / activeCustomers : 0;

    return {
      totalCustomers,
      activeCustomers,
      customerRetentionRate: 0,
      customerLifetimeValue: ltv,
      topCustomersByRevenue: []
    };
  }
}
