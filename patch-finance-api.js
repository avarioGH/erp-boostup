const fs = require('fs');
let c = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');
c = c.replace(/\/reports\/finance\/balance-sheet/g, '/finance/reports/balance-sheet');
c = c.replace(/\/reports\/finance\/cash-flow/g, '/finance/reports/cash-flow');
c = c.replace(/\/reports\/finance\/profit-loss/g, '/finance/reports/profit-loss');
// Also add createExpense to FinanceAPI
if (!c.includes('createExpense:')) {
  c = c.replace(/getCategories: async/g, "createExpense: async (data: any) => (await api.post('/finance/expense', data)).data,\n  getCategories: async");
}
fs.writeFileSync('frontend/src/lib/api.ts', c);
