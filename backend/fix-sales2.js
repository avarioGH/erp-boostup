const fs = require('fs');
let file = 'src/sales/timber-sales.service.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/async findAllOrders\(page = 1, limit = 20, status\?: string, customerId\?: string\)/, "async findAllOrders(page = 1, limit = 20, status?: string, customerId?: string, companyId?: string)");
fs.writeFileSync(file, content);
