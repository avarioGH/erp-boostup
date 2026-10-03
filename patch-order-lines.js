const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/sales/orders/page.tsx', 'utf8');

// Replace details.lines => items
content = content.replace(/details\.lines/g, "(details.items || details.lines || [])");

// Replace line.quantity => qty
content = content.replace(/line\.quantity/g, "(line.qty || line.quantity || 0)");

fs.writeFileSync('frontend/src/app/sales/orders/page.tsx', content);
