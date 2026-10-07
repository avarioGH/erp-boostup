const fs = require('fs');
let code = fs.readFileSync('backend/src/finance/payment/payment.service.ts', 'utf8');
code = code.replace("payment_status: allPaid ? 'PAID' : anyPaid ? 'PARTIALLY_PAID' : 'UNPAID',", "payment_status: allPaid ? 'PAID' : anyPaid ? 'PARTIAL' : 'UNPAID',");
fs.writeFileSync('backend/src/finance/payment/payment.service.ts', code);
console.log('Fixed PARTIAL status');
