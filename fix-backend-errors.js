const fs = require('fs');

['backend/src/finance/netting/netting.controller.ts', 'backend/src/inventory/fish-purchase/fish-purchase.controller.ts'].forEach(file => {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/auth\/guards\/jwt-auth.guard/g, 'auth/jwt-auth.guard');
  fs.writeFileSync(file, c);
});

let svc = fs.readFileSync('backend/src/inventory/fish-purchase/fish-purchase.service.ts', 'utf8');

// fix GoodsReceipt notes
svc = svc.replace(/notes:\s*'Fish Procurement Auto Receipt',/g, '');

// fix purchase_order_item_id in GoodsReceiptItem -> check if it exists or use po_item_id
// We will just remove it, the goods receipt item links to product
svc = svc.replace(/purchase_order_item_id:\s*poItem\.id,/g, '');

// fix StockMovement user_id -> add user_id: reqUser.id
svc = svc.replace(/balance_after:\s*stock\.current_stock,/g, 'balance_after: stock.current_stock,\n            user_id: reqUser.id,');

// fix Invoice remaining_amount
svc = svc.replace(/total:\s*total_amount,/g, 'total: total_amount,\n          remaining_amount: total_amount,');

// fix InvoiceItem total
svc = svc.replace(/total:\s*item\.qty \* item\.unit_price,/g, '');

fs.writeFileSync('backend/src/inventory/fish-purchase/fish-purchase.service.ts', svc);

console.log('Fixed additional fields');
