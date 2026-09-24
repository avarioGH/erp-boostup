const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/inventory/purchase/page.tsx', 'utf-8');

code = code.replace(
  /\.catch\(\(err\) => {/g,
  '.catch((err: any) => {'
);

fs.writeFileSync('frontend/src/app/inventory/purchase/page.tsx', code);
console.log('Fixed implicit any type in purchase page');
