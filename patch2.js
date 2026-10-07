const fs = require('fs');
let code = fs.readFileSync('backend/src/inventory/inventory.service.ts', 'utf8');
const start = code.indexOf('async getFifoDiagnostic');
const end = code.lastIndexOf('}');
code = code.substring(0, start) + fs.readFileSync('fix-diag.ts', 'utf8') + '\n}\n';
fs.writeFileSync('backend/src/inventory/inventory.service.ts', code);
