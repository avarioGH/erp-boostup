const fs = require('fs');
const path = 'backend/src/crm/order.controller.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(/@Controller\('orders'\)/, "@Controller('sales/orders')");
fs.writeFileSync(path, code);
console.log('Fixed OrderController route');
