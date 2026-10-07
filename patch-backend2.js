const fs = require('fs');
let code = fs.readFileSync('backend/src/purchasing/purchasing.service.ts', 'utf8');

code = code.replace(
  'for (const bItem of billData.items) {',
  `// Auto-fill billData if empty (e.g. fast bill)
        if (!billData.items || billData.items.length === 0) {
          billData.items = po.items.map((i: any) => ({
            productId: i.product_id,
            qty: i.qty - (i.billed_qty || 0),
          })).filter((i: any) => i.qty > 0);
        }

        for (const bItem of billData.items) {`
);

fs.writeFileSync('backend/src/purchasing/purchasing.service.ts', code);
console.log('patched backend createVendorBill regex');
