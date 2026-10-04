const fs = require('fs');
let c = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');
c = c.replace(/createExpense: async \(data: any\) => \(await api\.post\('\/finance\/expense'/g, "createExpense: async (data: any) => (await api.post('/finance/cash-out'");
fs.writeFileSync('frontend/src/lib/api.ts', c);
