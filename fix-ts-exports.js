const fs = require('fs');
let s = fs.readFileSync('frontend/src/app/sales/exports/create/page.tsx', 'utf8');

s = s.replace(/\.then\(res =>/g, '.then((res: any) =>');

fs.writeFileSync('frontend/src/app/sales/exports/create/page.tsx', s);
console.log('Fixed typescript error in exports page');
