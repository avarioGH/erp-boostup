const fs = require('fs');
const path = 'backend/src/inventory/fish-purchase/fish-purchase.service.ts';
let content = fs.readFileSync(path, 'utf8');

// Undo the previous specific patch
content = content.replace(
    /qty:\s*Number\(item\.qty\),/g,
    'qty: item.qty,'
);
content = content.replace(
    /unit_price:\s*Number\(item\.unit_price\),/g,
    'unit_price: item.unit_price,'
);
content = content.replace(
    /subtotal:\s*Number\(item\.qty\) \* Number\(item\.unit_price\),/g,
    'subtotal: item.qty * item.unit_price,'
);
content = content.replace(
    /received_qty:\s*Number\(item\.qty\),/g,
    'received_qty: item.qty,'
);
content = content.replace(
    /billed_qty:\s*Number\(item\.qty\),/g,
    'billed_qty: item.qty,'
);
content = content.replace(
    /items\.forEach\(\(i: any\) => \{ total_amount \+= Number\(i\.qty\) \* Number\(i\.unit_price\) \}\);/g,
    'items.forEach((i: any) => { total_amount += i.qty * i.unit_price });'
);

// Map items safely at the top
content = content.replace(
    /const \{\s*partner_id,\s*warehouse_id,\s*date,\s*paid_amount,\s*items\s*\} = data;/g,
    `let { partner_id, warehouse_id, date, paid_amount, items } = data;
    items = items.map((i: any) => ({
      ...i,
      qty: Number(i.qty || 0),
      unit_price: Number(i.unit_price || 0)
    }));
    paid_amount = Number(paid_amount || 0);`
);

fs.writeFileSync(path, content);
