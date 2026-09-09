const fs = require('fs');
let content = fs.readFileSync('test/ecommerce.20b.2.ts', 'utf8');

content = content.replace(
  "{ company_id: compA.id, invoice_number: 'INV-A-1', invoice_date: new Date(), due_date: new Date(), status: 'DRAFT', total: 100, remaining_amount: 100, type: 'SALES' }",
  "{ company_id: compA.id, invoice_number: 'INV-A-1', invoice_date: new Date(), due_date: new Date(), status: 'DRAFT', subtotal: 100, tax: 0, total: 100, remaining_amount: 100, type: 'SALES' }"
);

fs.writeFileSync('test/ecommerce.20b.2.ts', content);
