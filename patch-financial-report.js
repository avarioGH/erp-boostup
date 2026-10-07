const fs = require('fs');

let code = fs.readFileSync('backend/src/reports/services/financial-report.service.ts', 'utf8');

// Inject FinanceService
if (!code.includes('FinanceService')) {
  code = code.replace("import { PrismaService } from '../../prisma/prisma.service';", "import { PrismaService } from '../../prisma/prisma.service';\nimport { FinanceService } from '../../finance/finance.service';");
  code = code.replace("constructor(private prisma: PrismaService) {}", "constructor(private prisma: PrismaService, private financeService: FinanceService) {}");
}

code = code.replace(
  /async getProfitAndLoss\(filters: ReportFilterDto\): Promise<ReportResultDto> \{[\s\S]*?totals: \{ amount: netProfit \},\n    \};\n  \}/m,
  `async getProfitAndLoss(filters: ReportFilterDto): Promise<ReportResultDto> {
    const pnl = await this.financeService.getProfitLossReport(
      filters.company_id,
      filters.start_date ? new Date(filters.start_date) : undefined,
      filters.end_date ? new Date(filters.end_date) : undefined
    );

    return {
      title: 'Profit & Loss (Accrual)',
      columns: [
        { header: 'Category', key: 'category' },
        { header: 'Amount', key: 'amount', type: 'currency' },
      ],
      data: [
        { category: 'Gross Revenue', amount: pnl.totalRevenue },
        { category: 'Contra Revenue', amount: -pnl.totalContraRevenue },
        { category: 'Net Revenue', amount: pnl.netRevenue },
        { category: 'Cost of Goods Sold', amount: pnl.totalCogs },
        { category: 'Gross Profit', amount: pnl.grossProfit },
        { category: 'Operating Expenses', amount: pnl.totalOperatingExpenses },
        { category: 'Other Income', amount: pnl.totalOtherIncome },
        { category: 'Other Expenses', amount: pnl.totalOtherExpenses },
        { category: 'Net Profit', amount: pnl.netProfit },
      ],
      totals: { amount: pnl.netProfit },
    };
  }`
);

fs.writeFileSync('backend/src/reports/services/financial-report.service.ts', code);
console.log('patched financial-report.service.ts');
