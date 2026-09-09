const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');

const smSeed = "await prisma.stockMovement.create({ data: { id: '600000000000000000000501', company_id: comp, warehouse_id: wh, product_id: prod, quantity: 100, movement_type: 'IN', movement_date: new Date('2024-01-01'), reference_type: 'INITIAL' }});\n    await prisma.stockMovement.create({ data: { id: '600000000000000000000502', company_id: comp, warehouse_id: wh, product_id: prod, quantity: 100, movement_type: 'IN', movement_date: new Date('2024-01-02'), reference_type: 'INITIAL' }});\n    await prisma.inventoryCostLayer.create";

code = code.replace(/await prisma\.inventoryCostLayer\.create/g, "await prisma.stockMovement.create({ data: { id: '600000000000000000000501', company_id: comp, warehouse_id: wh, product_id: prod, quantity: 100, movement_type: 'IN', movement_date: new Date('2024-01-01'), reference_type: 'INITIAL' }}).catch(()=>null);\n    await prisma.stockMovement.create({ data: { id: '600000000000000000000502', company_id: comp, warehouse_id: wh, product_id: prod, quantity: 100, movement_type: 'IN', movement_date: new Date('2024-01-02'), reference_type: 'INITIAL' }}).catch(()=>null);\n    await prisma.inventoryCostLayer.create");

code = code.replace(/company_id: c1, warehouse_id: w2, product_id: p1, quantity: 100, remaining_quantity: 100, unit_cost: 20000, layer_date: new Date\('2024-01-01'\) \}\}\);/g, "company_id: c1, warehouse_id: w2, product_id: p1, quantity: 100, remaining_quantity: 100, unit_cost: 20000, layer_date: new Date('2024-01-01'), source_movement_id: '600000000000000000000503' }});");

fs.writeFileSync('test/final.certification.ts', code);
