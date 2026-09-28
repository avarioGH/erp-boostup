const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/inventory/purchase/create/page.tsx', 'utf8');
content = content.replace(/\{s\.name \|\| s\.code\}/g, "{s.name || s.code || 'Unnamed Supplier'}");
content = content.replace(/\{w\.name \|\| w\.code\}/g, "{w.name || w.code || 'Unnamed Warehouse'}");
fs.writeFileSync('frontend/src/app/inventory/purchase/create/page.tsx', content);
