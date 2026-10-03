const fs = require('fs');
let file = 'backend/src/sales/export-shipment.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('{ created_at: \'desc\' }', '{ createdAt: \'desc\' }');

fs.writeFileSync(file, content);
console.log('Fixed field name to createdAt');
