const fs = require('fs');
let file = 'backend/src/crm/quotation/sales-order.controller.ts';
let content = fs.readFileSync(file, 'utf8');

const oldSort = `orderBy: { order_date: 'desc' },`;
const newSort = `orderBy: [
        { order_date: 'desc' },
        { created_at: 'desc' }
      ],`;

content = content.replace(oldSort, newSort);
fs.writeFileSync(file, content);
console.log('Patched sales-order.controller.ts');
