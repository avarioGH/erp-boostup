const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');
c = c.replace(/sales\.totalSales/g, 'sales.totalInvoiced');
fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
