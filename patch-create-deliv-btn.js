const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/sales/orders/page.tsx', 'utf8');

s = s.replace(
  /\{details\.status === 'CONFIRMED' && \(/,
  "{(details.status === 'CONFIRMED' || details.status === 'COMPLETED') && ("
);

fs.writeFileSync('frontend/src/app/sales/orders/page.tsx', s);
console.log('Patched Create Delivery button');
