const fs = require('fs');
let code = fs.readFileSync('src/manufacturing/mo/mo.service.ts', 'utf8');

code = code.replace(/if \(total_cost > 0\) \{/, "if (totalCogs > 0) {");
code = code.replace(/totalValue: total_cost,/, "totalValue: totalCogs,");

fs.writeFileSync('src/manufacturing/mo/mo.service.ts', code, 'utf8');
console.log('patched mo cogs bug');
