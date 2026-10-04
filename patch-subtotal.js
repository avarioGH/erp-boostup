const fs = require('fs');

let fp = fs.readFileSync('backend/src/inventory/fish-purchase/fish-purchase.service.ts', 'utf8');

fp = fp.replace(/unit_price: item\.unit_price,\s+received_qty:/g, 'unit_price: item.unit_price,\n            subtotal: item.qty * item.unit_price,\n            received_qty:');
fp = fp.replace(/unit_price: item\.unit_price,\s+tax:/g, 'unit_price: item.unit_price,\n            subtotal: item.qty * item.unit_price,\n            tax:');

fs.writeFileSync('backend/src/inventory/fish-purchase/fish-purchase.service.ts', fp);
console.log('Fixed subtotal property missing');
