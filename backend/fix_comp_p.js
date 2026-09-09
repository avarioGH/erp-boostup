const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');

code = code.replace(/await prisma\.stockMovement\.create\(\{ data: \{ id: '600000000000000000000501', company_id: comp, warehouse_id: wh, product_id: prod/g, "await prisma.stockMovement.create({ data: { id: '600000000000000000000501', company_id: c1, warehouse_id: w1, product_id: p1");

code = code.replace(/await prisma\.stockMovement\.create\(\{ data: \{ id: '600000000000000000000502', company_id: comp, warehouse_id: wh, product_id: prod/g, "await prisma.stockMovement.create({ data: { id: '600000000000000000000502', company_id: c1, warehouse_id: w1, product_id: p1");

// Then restore inside seedLayers:
const sm_bad_1 = "const seedLayers = async (comp = c1, prod = p1, wh = w1) => {\n    await prisma.warehouseStock.create({ data: { company_id: comp, warehouse_id: wh, product_id: prod, current_stock: 200, available_stock: 200 } });\n    await prisma.stockMovement.create({ data: { id: '600000000000000000000501', company_id: c1, warehouse_id: w1, product_id: p1";
const sm_good_1 = "const seedLayers = async (comp = c1, prod = p1, wh = w1) => {\n    await prisma.warehouseStock.create({ data: { company_id: comp, warehouse_id: wh, product_id: prod, current_stock: 200, available_stock: 200 } });\n    await prisma.stockMovement.create({ data: { id: '600000000000000000000501', company_id: comp, warehouse_id: wh, product_id: prod";

code = code.replace(sm_bad_1, sm_good_1);

const sm_bad_2 = "INITIAL' }}).catch(()=>null);\n    await prisma.stockMovement.create({ data: { id: '600000000000000000000502', company_id: c1, warehouse_id: w1, product_id: p1, quantity: 100, movement_type: 'IN', movement_date: new Date('2024-01-02'), reference_type: 'INITIAL' }}).catch(()=>null);\n    await prisma.inventoryCostLayer.create({ data: { company_id: comp, warehouse_id: wh, product_id: prod";
const sm_good_2 = "INITIAL' }}).catch(()=>null);\n    await prisma.stockMovement.create({ data: { id: '600000000000000000000502', company_id: comp, warehouse_id: wh, product_id: prod, quantity: 100, movement_type: 'IN', movement_date: new Date('2024-01-02'), reference_type: 'INITIAL' }}).catch(()=>null);\n    await prisma.inventoryCostLayer.create({ data: { company_id: comp, warehouse_id: wh, product_id: prod";

code = code.replace(sm_bad_2, sm_good_2);

fs.writeFileSync('test/final.certification.ts', code);
