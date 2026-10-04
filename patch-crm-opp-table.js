const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');
c = c.replace(/crm\.opportunities\.map/g, '(opportunities || []).map');
fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
