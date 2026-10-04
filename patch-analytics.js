const fs = require('fs');
const path = 'backend/src/analytics/analytics.service.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace the fake calculations in getDashboardKPIs
content = content.replace(
    /\/\/ For Finance, filter by warehouse if possible[\s\S]*?const cashFlow = monthlyRevenue \* 0\.8; \/\/ Approximation since Finance doesn't have warehouse_id/,
    `const financeWhere: any = {
      company_id: companyId,
      status: { in: ['Approved', 'COMPLETED', 'POSTED'] },
      transaction_date: { gte: firstDayOfMonth },
    };
    if (warehouseId && warehouseId !== 'all') {
      financeWhere.warehouse_id = warehouseId;
    }

    const financeTransactions = await this.prisma.financeTransaction.findMany({
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

    const netProfit = realCashIn - realCashOut;
    const cashFlow = realCashIn;`
);

// Replace the whereBase.OR logic that is too complex and wrong
content = content.replace(
    /if \(warehouseId && warehouseId !== 'all'\) \{\s*whereBase\.OR = \[\s*\{ pos_shift: \{ warehouse_id: warehouseId \} \},\s*\{ customer: \{ warehouse_id: warehouseId \} \},\s*\{\s*items: \{\s*some: \{\s*product: \{\s*warehouse_stocks: \{ some: \{ warehouse_id: warehouseId \} \},\s*\},\s*\},\s*\},\s*\},\s*\];\s*\}/,
    `if (warehouseId && warehouseId !== 'all') {
      whereBase.warehouse_id = warehouseId;
    }`
);

// Replace fake chart data profit
content = content.replace(
    /profit: \(dayAgg\._sum\.total_amount \|\| 0\) \* 0\.2,/g,
    `profit: 0,`
);

content = content.replace(
    /const chartDataArray: any\[\] = \[\];\s*for \(let i = 6; i >= 0; i--\) \{[\s\S]*?chartDataArray\.push\(\{[\s\S]*?\}\);\s*\}/,
    `const chartDataArray: any[] = [];
    
    // Fetch last 7 days finance transactions
    const d7 = new Date();
    d7.setDate(d7.getDate() - 6);
    d7.setHours(0, 0, 0, 0);
    
    const weekFinanceWhere: any = {
      company_id: companyId,
      status: { in: ['Approved', 'COMPLETED', 'POSTED'] },
      transaction_date: { gte: d7 },
    };
    if (warehouseId && warehouseId !== 'all') weekFinanceWhere.warehouse_id = warehouseId;
    
    const weekFinanceTransactions = await this.prisma.financeTransaction.findMany({
      where: weekFinanceWhere
    });
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayAgg = await this.prisma.salesOrder.aggregate({
        where: { ...whereBase, order_date: { gte: d, lt: nextD } },
        _sum: { total_amount: true },
      });
      
      let dayCashIn = 0;
      let dayCashOut = 0;
      weekFinanceTransactions.forEach(ft => {
        if (ft.transaction_date >= d && ft.transaction_date < nextD) {
           if (['Cash In', 'Income'].includes(ft.transaction_type)) dayCashIn += ft.total_amount;
           else if (['Cash Out', 'Expense', 'Payment'].includes(ft.transaction_type)) dayCashOut += ft.total_amount;
        }
      });

      chartDataArray.push({
        date: d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        revenue: dayAgg._sum.total_amount || 0,
        profit: dayCashIn - dayCashOut,
        cashIn: dayCashIn,
        cashOut: dayCashOut
      });
    }`
);

// Update chart format
content = content.replace(
    /chartData: \{ sales: chartDataArray\.map\(d => \(\{ date: d\.date, sales: d\.revenue, profit: d\.profit \}\)\), cashflow: chartDataArray\.map\(d => \(\{ name: d\.date, income: d\.revenue, expense: d\.profit \}\)\) \},/,
    `chartData: { 
        sales: chartDataArray.map(d => ({ date: d.date, sales: d.revenue, profit: d.profit })), 
        cashflow: chartDataArray.map(d => ({ name: d.date, income: d.cashIn, expense: d.cashOut })) 
      },`
);

fs.writeFileSync(path, content);
