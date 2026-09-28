const fs = require('fs');
let code = fs.readFileSync('test-minimal.js', 'utf8');
code = code.replace(
  "const uatLoc2 = await uat.warehouse.findFirst({ where: { company_id: '6ab79d610c6db3e45bbdf53b', id: { not: uatWH.id } } });",
  "let uatLoc2 = await uat.warehouse.findFirst({ where: { company_id: '6ab79d610c6db3e45bbdf53b', id: { not: uatWH.id } } }); if (!uatLoc2) { uatLoc2 = await uat.warehouse.create({ data: { company_id: '6ab79d610c6db3e45bbdf53b', code: 'WH-UAT-2', name: 'UAT WH 2' } }); }"
);
fs.writeFileSync('test-minimal.js', code);
