const fs = require('fs');
let c = fs.readFileSync('backend/src/hr/hr.controller.ts', 'utf8');
const idx = c.indexOf("@Permissions('hr.create')");
if (idx !== -1) {
  const newTop = fs.readFileSync('hr-imports.ts', 'utf8');
  fs.writeFileSync('backend/src/hr/hr.controller.ts', newTop + '\n  ' + c.substring(idx));
}
console.log('Fixed HR controller');

// Fix fish-purchase.service.ts
let fp = fs.readFileSync('backend/src/inventory/fish-purchase/fish-purchase.service.ts', 'utf8');
fp = fp.replace(/sub\s+received_qty:/g, 'subtotal: item.qty * item.unit_price,\n            received_qty:');
fp = fp.replace(/sub\s+tax: 0,/g, 'subtotal: item.qty * item.unit_price,\n            tax: 0,');
fs.writeFileSync('backend/src/inventory/fish-purchase/fish-purchase.service.ts', fp);
console.log('Fixed fish purchase');
