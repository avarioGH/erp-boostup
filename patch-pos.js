const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/pos/new-transaction/page.tsx', 'utf8');

s = s.replace(
  /partnerId: !isNewCustomer \? selectedCustomerId : undefined,/,
  'customerId: !isNewCustomer ? selectedCustomerId : undefined,'
);

fs.writeFileSync('frontend/src/app/pos/new-transaction/page.tsx', s);
console.log('Patched new-transaction for customerId');
