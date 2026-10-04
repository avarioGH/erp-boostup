const fs = require('fs');
const path = 'frontend/src/app/inventory/purchase-fish/create/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/partner_id: val/g, 'partner_id: val || ""');
content = content.replace(/warehouse_id: val/g, 'warehouse_id: val || ""');
content = content.replace(/status: val/g, 'status: val || ""');

fs.writeFileSync(path, content);
