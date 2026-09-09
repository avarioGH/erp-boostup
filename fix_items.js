const fs = require('fs');
let code = fs.readFileSync('backend/src/accounting/accounting.listener.ts', 'utf8');
code = code.replace(/const items = \[\];/, 'const items: any[] = [];');
fs.writeFileSync('backend/src/accounting/accounting.listener.ts', code, 'utf8');
