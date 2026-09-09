const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
// Fix delivered_qty -> qty in deliveryService.create calls
code = code.replace(/delivered_qty: 150/g, 'qty: 150');
code = code.replace(/delivered_qty: 50/g, 'qty: 50');
fs.writeFileSync('test/final.certification.ts', code);
console.log('done');
