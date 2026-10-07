const fs = require('fs');
const path = 'frontend/src/app/crm/partners/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

if (code.includes('\uFEFF')) {
  code = code.replace(/\uFEFF/g, '');
  fs.writeFileSync(path, code);
  console.log('BOM removed successfully using Node.');
} else {
  console.log('No BOM found in string.');
}
