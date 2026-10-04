const fs = require('fs');
let c = fs.readFileSync('backend/src/crm/customer360/customer360.service.ts', 'utf8');
c = c.replace(
  "else if (inv.type === 'AP' && inv.supplier_id === customerId) {",
  "else if (inv.type === 'AP' && (inv.supplier_id === customerId || inv.customer_id === customerId)) {"
);
fs.writeFileSync('backend/src/crm/customer360/customer360.service.ts', c);
