const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');

code = code.replace(/const seedLayers = async \(comp = c1, prod = p1, wh = w1\) => \{\n    await prisma\.warehouseStock\.create\(\{ data: \{ company_id: c1, warehouse_id: w1, product_id: p1/g, "const seedLayers = async (comp = c1, prod = p1, wh = w1) => {\n    await prisma.warehouseStock.create({ data: { company_id: comp, warehouse_id: wh, product_id: prod");

code = code.replace(/await prisma\.stockMovement\.create\(\{ data: \{ id: '600000000000000000000501', company_id: c1, warehouse_id: w1, product_id: p1/g, "await prisma.stockMovement.create({ data: { id: '600000000000000000000501', company_id: comp, warehouse_id: wh, product_id: prod");

code = code.replace(/await prisma\.stockMovement\.create\(\{ data: \{ id: '600000000000000000000502', company_id: c1, warehouse_id: w1, product_id: p1/g, "await prisma.stockMovement.create({ data: { id: '600000000000000000000502', company_id: comp, warehouse_id: wh, product_id: prod");

fs.writeFileSync('test/final.certification.ts', code);
