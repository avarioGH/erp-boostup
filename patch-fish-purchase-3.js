const fs = require('fs');
const path = 'backend/src/inventory/fish-purchase/fish-purchase.service.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /const \{ partner_id, warehouse_id, date, items, paid_amount, payment_method \} = data;/g,
    `let { partner_id, warehouse_id, date, items, paid_amount, payment_method } = data;
    items = items.map((i: any) => ({
      ...i,
      qty: Number(i.qty || 0),
      unit_price: Number(i.unit_price || 0)
    }));
    paid_amount = Number(paid_amount || 0);`
);

fs.writeFileSync(path, content);
