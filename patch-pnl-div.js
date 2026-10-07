const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/finance/reports/profit-loss/page.tsx', 'utf8');

code = code.replace(
  "<div className={p-4 rounded-xl flex justify-between items-center text-xl font-bold }>",
  "<div className={`p-4 rounded-xl flex justify-between items-center text-xl font-bold ${(data?.netProfit || 0) >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>"
);

fs.writeFileSync('frontend/src/app/finance/reports/profit-loss/page.tsx', code);
console.log('patched net profit div');
