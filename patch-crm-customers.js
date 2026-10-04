const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', 'utf8');
c = c.replace(/api\.get\('\/crm\/customers'\)/g, "api.get('/customers')");
fs.writeFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', c);
