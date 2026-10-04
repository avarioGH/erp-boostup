const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');
c = c.replace(/sales\.orders\.map/g, '(salesOrders || []).map');
c = c.replace(/sales\.orders\.length/g, '(salesOrders || []).length');
c = c.replace(/sales\.orders/g, '(salesOrders || [])');
fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
