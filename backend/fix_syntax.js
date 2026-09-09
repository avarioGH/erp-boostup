const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');

code = code.replace(/if \(threw && \(\(await prisma\.warehouseStock\.findFirst\(\{ where: \{ product_id: p1, warehouse_id: w1 \}\}\)\)\?\.current_stock === 50\)\)\?\.current_stock === 50\)\) \{/, "if (threw && (await prisma.warehouseStock.findFirst({ where: { product_id: p1, warehouse_id: w1 }}))?.current_stock === 50) {");

fs.writeFileSync('test/final.certification.ts', code);
