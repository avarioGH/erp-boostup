const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');
c = c.replace(/crm\.opportunities\.length/g, 'crm.activeOpportunities');
fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
