const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/sales/orders/page.tsx', 'utf8');

s = s.replace(
  /\(details\.status === 'CONFIRMED' \|\| details\.status === 'DELIVERED'\)/g,
  "(details.status === 'CONFIRMED' || details.status === 'DELIVERED' || details.status === 'COMPLETED')"
);

fs.writeFileSync('frontend/src/app/sales/orders/page.tsx', s);
console.log('Patched sales orders page');
