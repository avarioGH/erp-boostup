const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');
c = c.replace(/\.\.\.deliveries\.map/g, '...(sales.deliveries || []).map');
c = c.replace(/\.\.\.quotations\.map/g, '...(sales.quotations || []).map');
fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
