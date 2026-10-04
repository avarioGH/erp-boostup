const fs = require('fs');
const path = 'backend/src/inventory/fish-purchase/fish-purchase.service.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /const poItem = await tx\.purchaseOrderItem\.create\(\{\s*data:\s*\{\s*purchase_order_id:\s*purchaseOrder\.id,\s*product_id:\s*item\.product_id,\s*qty:\s*item\.qty,\s*unit_price:\s*item\.unit_price,\s*subtotal:\s*item\.qty \* item\.unit_price,\s*received_qty:\s*item\.qty,\s*billed_qty:\s*item\.qty,\s*\}\s*\}\);/g,
    `const poItem = await tx.purchaseOrderItem.create({
          data: {
            purchase_order_id: purchaseOrder.id,
            product_id: item.product_id,
            qty: Number(item.qty),
            unit_price: Number(item.unit_price),
            subtotal: Number(item.qty) * Number(item.unit_price),
            received_qty: Number(item.qty),
            billed_qty: Number(item.qty),
          }
        });`
);

content = content.replace(
    /let total_amount = 0;\s*items\.forEach\(\(i: any\) => \{ total_amount \+= i\.qty \* i\.unit_price \}\);/g,
    `let total_amount = 0;
    items.forEach((i: any) => { total_amount += Number(i.qty) * Number(i.unit_price) });`
);

fs.writeFileSync(path, content);
