const fs = require('fs');
const path = 'backend/src/analytics/analytics.service.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace chartDataArray.push to use dayAgg instead of dayPnl
code = code.replace(
  /chartDataArray\.push\(\{\s+date: d\.toLocaleDateString\('id-ID', \{ month: 'short', day: 'numeric' \}\),\s+revenue: dayPnl\.netRevenue,\s+profit: dayPnl\.netProfit,\s+cashIn: dayCashIn,\s+cashOut: dayCashOut\s+\}\);/,
  `chartDataArray.push({
          date: d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
          revenue: dayAgg._sum.total_amount || 0,
          profit: dayPnl.netProfit, // Profit is global for now
          cashIn: dayCashIn,
          cashOut: dayCashOut
        });`
);

// Also fix currentRevenue to actually be the Month's revenue for the selected warehouse
// Let's replace the pnl block
code = code.replace(
  /const pnl = await this\.finance\.getProfitLossReport\(companyId, firstDayOfMonth, new Date\(\)\);\s+const netProfit = pnl\.netProfit;\s+const currentRevenue = pnl\.netRevenue;/,
  `const pnl = await this.finance.getProfitLossReport(companyId, firstDayOfMonth, new Date());
      const netProfit = pnl.netProfit;
      
      const monthAgg = await this.prisma.salesOrder.aggregate({
        where: { ...whereBase, order_date: { gte: firstDayOfMonth } },
        _sum: { total_amount: true }
      });
      const currentRevenue = monthAgg._sum.total_amount || 0;`
);

fs.writeFileSync(path, code);
console.log('Fixed analytics.service.ts');
