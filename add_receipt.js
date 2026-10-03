const fs = require('fs');
let r = fs.readFileSync('frontend/src/app/pos/new-transaction/page.tsx', 'utf8');

// From byte analysis: after checkout(); there's \r\n then 1 space then alert
const oldBlock = 'await PosAPI.checkout(payload);\r\n alert(`Transaksi Sukses! (Tersimpan ke Database Real)`);\r\n setCart([]);\r\n setIsPaymentOpen(false);\r\n setIdempotencyKey(crypto.randomUUID());';

if (r.includes(oldBlock)) {
  const newBlock = [
    'const checkoutResult = await PosAPI.checkout(payload);',
    " const _user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('erp_user') || '{}') : {};",
    " const _activeWh = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('active_warehouse') || 'null') : null;",
    ' setReceiptData({',
    "   orderNumber: checkoutResult?.data?.order_number || checkoutResult?.order_number || ('POS-' + Date.now()),",
    '   date: new Date(),',
    '   items: cart.map((item) => ({ ...item })),',
    '   subtotal,',
    '   tax,',
    '   total,',
    '   paidAmount: Number(paidAmount) || total,',
    '   change: Math.max(0, (Number(paidAmount) || total) - total),',
    '   paymentMethod,',
    "   cashierName: _user?.name || 'Kasir',",
    "   warehouseName: _activeWh?.name || 'Pusat',",
    "   customerName: isNewCustomer ? newCustomerName : (customers.find((c) => c.id === selectedCustomerId)?.name || ''),",
    ' });',
    ' setIsReceiptOpen(true);',
    ' setCart([]);',
    ' setIsPaymentOpen(false);',
    ' setIdempotencyKey(crypto.randomUUID());'
  ].join('\r\n');
  
  r = r.replace(oldBlock, newBlock);
  fs.writeFileSync('frontend/src/app/pos/new-transaction/page.tsx', r);
  console.log('SUCCESS: checkout block replaced');
} else {
  console.log('FAIL: block not found, checking indent...');
  const alertIdx = r.indexOf('Transaksi Sukses');
  if (alertIdx > 0) {
    const before = r.substring(alertIdx - 20, alertIdx);
    console.log('Before alert:', JSON.stringify(before));
  }
}
