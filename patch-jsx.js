const fs = require('fs');
const path = 'frontend/src/app/crm/partners/[id]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /\{\(finance\.outstandingAmount > 0 && finance\.outstandingAp > 0\) && \(\s*\{\/\* NETTING MODAL \*\/\}\s*<Dialog/g,
  `{(finance.outstandingAmount > 0 && finance.outstandingAp > 0) && (\n<Dialog`
);

fs.writeFileSync(path, code);
console.log('Removed comment causing JSX error');
