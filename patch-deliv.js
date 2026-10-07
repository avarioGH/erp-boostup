const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/sales/deliveries/create/page.tsx', 'utf8');

s = s.replace(
  /const validOrders = \(res\?\.data \|\| \[\]\)\.filter\(\(o: any\) => o\.status === 'CONFIRMED' \|\| o\.delivery_status === 'PARTIAL'\)/,
  "const validOrders = (res?.data || []).filter((o: any) => o.order_number?.startsWith('SO') && o.delivery_status !== 'DELIVERED')"
);

fs.writeFileSync('frontend/src/app/sales/deliveries/create/page.tsx', s);
console.log('Patched deliveries filter');
