const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
code = code.replace(/name: 'Prod1',/g, "name: 'Prod1', code: 'P1', type: 'GOODS',");
fs.writeFileSync('test/final.certification.ts', code);
