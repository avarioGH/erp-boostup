const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');

c = c.replace(/onValueChange=\{set([a-zA-Z0-9_]+)\}/g, 'onValueChange={(val: any) => set$1(val || "")}');

fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
console.log('Fixed all onValueChanges');
