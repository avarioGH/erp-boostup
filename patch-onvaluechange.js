const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');
c = c.replace(/onValueChange=\{\(val: string\) => setPayMethod\(val\)\}/g, 'onValueChange={(val: any) => setPayMethod(val || "")}');
fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
console.log('Fixed onValueChange');
