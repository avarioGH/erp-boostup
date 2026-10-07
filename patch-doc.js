const fs = require('fs');
let code = fs.readFileSync('backend/src/reports/document.service.ts', 'utf8');

code = code.replace(
  "product: (item.product?.name || '') + (item.description ? ' - ' + item.description : ''),",
  "product: item.product?.name || '',"
);

fs.writeFileSync('backend/src/reports/document.service.ts', code);
console.log('patched document.service.ts description issue');
