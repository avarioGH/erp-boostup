const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', 'utf8');
c = c.replace(/\\`\(\\\$\{p\.code\}\)\\`/g, '`(${p.code})`');
fs.writeFileSync('frontend/src/app/inventory/purchase-fish/create/page.tsx', c);
console.log('Fixed backslash error');
