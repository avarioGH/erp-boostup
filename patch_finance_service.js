const fs = require('fs');
let code = fs.readFileSync('backend/src/finance/finance.service.ts', 'utf8');

const newMethod = 
  async getCashReconciliation(companyId: string) {
    const cashAccounts = await this.prisma.cashAccount.findMany({
      where: { company_id: companyId },
      include: { chart_of_account: true }
    });

    const results = [];

    for (const ca of cashAccounts) {
      const operationalBalance = ca.current_balance;
      
      if (!ca.chart_of_account_id) {
        results.push({
          cashAccountId: ca.id,
          code: ca.code,
          name: ca.name,
          operationalBalance,
          glBalance: null,
          difference: null,
          status: 'UNMAPPED'
        });
        continue;
      }

      // Calculate GL Balance
      const glItems = await this.prisma.journalEntryItem.aggregate({
        where: {
          account_id: ca.chart_of_account_id,
          journal_entry: {
            company_id: companyId,
            status: 'Posted'
          }
        },
        _sum: { debit: true, credit: true }
      });

      const debit = glItems._sum.debit || 0;
      const credit = glItems._sum.credit || 0;
      // Normal balance for Cash/Bank is Debit
      const glBalance = debit - credit;

      const difference = operationalBalance - glBalance;
      
      let status = 'RECONCILED';
      if (Math.abs(difference) > 0.0001) status = 'MISMATCH';

      results.push({
        cashAccountId: ca.id,
        code: ca.code,
        name: ca.name,
        operationalBalance,
        glBalance,
        difference,
        status,
        mappedAccount: ca.chart_of_account?.account_name
      });
    }

    return results;
  }
;

// replace last closing bracket safely
const lastIndex = code.lastIndexOf('}');
code = code.substring(0, lastIndex) + newMethod + '\\n}';
fs.writeFileSync('backend/src/finance/finance.service.ts', code, 'utf8');
