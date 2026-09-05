const fs = require('fs');
let code = fs.readFileSync('backend/src/crm/crm.service.ts', 'utf8');

code = code.replace('let existingCustomer = null;', 'let existingCustomer: any = null;');

fs.writeFileSync('backend/src/crm/crm.service.ts', code);
