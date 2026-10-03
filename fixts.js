const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/sales/orders/create/page.tsx', 'utf8');
content = content.replace('setPaidAmount(e.target.value)', 'setPaidAmount(e.target.value ? Number(e.target.value) : "")');
fs.writeFileSync('frontend/src/app/sales/orders/create/page.tsx', content);
