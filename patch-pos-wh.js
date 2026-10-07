const fs = require('fs');
let s = fs.readFileSync('backend/src/pos/pos.service.ts', 'utf8');

// Fix the SalesOrder creation to include warehouse_id
s = s.replace(
  /const salesOrder = await tx\.salesOrder\.create\(\{\n\s*data: \{\n\s*company_id: companyId,\n\s*order_number: soNo,/,
  `const salesOrder = await tx.salesOrder.create({
          data: {
            company_id: companyId,
            warehouse_id: resolvedWarehouseId,
            order_number: soNo,`
);

fs.writeFileSync('backend/src/pos/pos.service.ts', s);
console.log('Patched pos service to save warehouse_id');
