const fs = require('fs');
let content = fs.readFileSync('test/ecommerce.20b.1.ts', 'utf8');

content = content.replace(
  "{ name: 'attachment.delete', code: 'DOC_D' }",
  "{ name: 'attachment.delete', code: 'DOC_D' }, { name: 'inventory.warehouse.update', code: 'INV_WU' }, { name: 'inventory.warehouse.delete', code: 'INV_WD' }, { name: 'reports.view', code: 'REP_V2' }" // Added some duplicates safely
);

fs.writeFileSync('test/ecommerce.20b.1.ts', content);
