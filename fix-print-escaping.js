const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/sales/orders/[id]/print/page.tsx', 'utf8');

// The file has literal \` and \$. We need to remove the slashes.
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync('frontend/src/app/sales/orders/[id]/print/page.tsx', content);
