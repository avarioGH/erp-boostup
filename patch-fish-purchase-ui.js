const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', 'utf8');
c = c.replace(/setPartners\(pRes\.data \|\| \[\]\)/, "setPartners(pRes.data?.data || pRes.data || [])");
fs.writeFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', c);
