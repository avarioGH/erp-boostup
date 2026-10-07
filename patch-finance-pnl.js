const fs = require('fs');

let code = fs.readFileSync('backend/src/finance/finance.service.ts', 'utf8');

const regex = /async getProfitLossReport\(companyId: string\) \{[\s\S]*?return \{[\s\S]*?\};\n  \}/;

const replacement = `async getProfitLossReport(companyId: string, startDate?: Date, endDate?: Date) {
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
  }`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('backend/src/finance/finance.service.ts', code);
  console.log('patched finance.service.ts');
} else {
  console.log('regex not matched');
}
