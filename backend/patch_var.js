const fs = require('fs');
let code = fs.readFileSync('src/crm/delivery/delivery.service.ts', 'utf8');

code = code.replace(/let anyDelivered = false;\\n      let totalDeliveryCogs = 0;/, "let anyDelivered = false;");
code = code.replace(/const so = delivery\.sales_order;/, "const so = delivery.sales_order;\n      let totalDeliveryCogs = 0;");

fs.writeFileSync('src/crm/delivery/delivery.service.ts', code, 'utf8');
console.log('fixed delivery var');
