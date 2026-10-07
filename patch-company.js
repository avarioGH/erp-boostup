const fs = require('fs');
const path = 'backend/prisma/schema.prisma';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /cash_accounts        CashAccount\[\]/,
  'cash_accounts        CashAccount[]\n  shifts               Shift[]'
);

fs.writeFileSync(path, code);
console.log('added relation to Company');
