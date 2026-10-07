const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');

const target = `<tr key={po.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">`;
const replacement = `<tr key={po.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => window.location.href = \`/purchasing/orders?id=\${po.id}\`}>`;

code = code.replace(target, replacement);

const targetSales = `<tr key={so.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">`;
const replacementSales = `<tr key={so.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => window.location.href = \`/sales/orders?id=\${so.id}\`}>`;

code = code.replace(targetSales, replacementSales);

fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', code);
console.log('patched crm partners page rows');
