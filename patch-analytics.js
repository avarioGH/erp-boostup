const fs = require('fs');

let code = fs.readFileSync('backend/src/analytics/analytics.service.ts', 'utf8');

// Inject FinanceService
if (!code.includes('FinanceService')) {
  code = code.replace("import { PrismaService } from '../prisma/prisma.service';", "import { PrismaService } from '../prisma/prisma.service';\nimport { FinanceService } from '../finance/finance.service';");
  code = code.replace("constructor(private prisma: PrismaService) {}", "constructor(private prisma: PrismaService, private finance: FinanceService) {}");
}

// Replace currentRevenue and netProfit
code = code.replace(
  /const financeTransactions = await this\.prisma\.financeTransaction\.findMany\(\{[\s\S]*?let realCashIn = 0;[\s\S]*?const cashFlow = realCashIn;/m,
  `const financeTransactions = await this.prisma.financeTransaction.findMany({
      where: financeWhere
    });

    let realCashIn = 0;
    let realCashOut = 0;
    financeTransactions.forEach(ft => {
      if (['Cash In', 'Income'].includes(ft.transaction_type)) {
        realCashIn += ft.total_amount;
      } else if (['Cash Out', 'Expense', 'Payment'].includes(ft.transaction_type)) {
        realCashOut += ft.total_amount;
      }
    });

    const cashFlow = realCashIn;
    
    // Get canonical Accrual P&L from GL
    const pnl = await this.finance.getProfitLossReport(companyId, firstDayOfMonth, new Date());
    const netProfit = pnl.netProfit;
    const currentRevenue = pnl.netRevenue;`
);

// Remove the old revenue calculation logic that was using SalesOrder total_amount so there's no conflict. Wait, the old code was:
code = code.replace(
  /const todayOrders = await this\.prisma\.salesOrder\.aggregate\(\{[\s\S]*?const monthlyRevenue = monthlyOrders\._sum\.total_amount \|\| 0;/m,
  `// Current Revenue is now derived from canonical GL P&L`
);


// Replace chartData revenue and profit to use canonical GL as well!
// Wait, chart data runs a loop for the last 7 days. If I call getProfitLossReport 7 times, it's 7 DB queries. That's fine.
code = code.replace(
  /chartDataArray\.push\(\{\n\s*date: d\.toLocaleDateString[\s\S]*?cashOut: dayCashOut\n\s*\}\);/g,
  `const dayPnl = await this.finance.getProfitLossReport(companyId, d, nextD);
      chartDataArray.push({
        date: d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        revenue: dayPnl.netRevenue,
        profit: dayPnl.netProfit,
        cashIn: dayCashIn,
        cashOut: dayCashOut
      });`
);

fs.writeFileSync('backend/src/analytics/analytics.service.ts', code);
console.log('patched analytics.service.ts');
