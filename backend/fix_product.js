const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');

const unitSeed = "await prisma.unit.createMany({ data: [ { id: 'u1', company_id: c1, name: 'Unit' }, { id: 'u2', company_id: c2, name: 'Unit' } ] });\n  ";
code = code.replace(/await prisma.product.createMany/g, unitSeed + "await prisma.product.createMany");
code = code.replace(/purchase_price: 50000 \},/g, "purchase_price: 50000, unit_id: 'u1' },");
code = code.replace(/purchase_price: 50000 \}\n/g, "purchase_price: 50000, unit_id: 'u2' }\n");
fs.writeFileSync('test/final.certification.ts', code);
