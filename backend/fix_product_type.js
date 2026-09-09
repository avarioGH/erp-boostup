const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
code = code.replace(/ type: 'GOODS',/g, "");
fs.writeFileSync('test/final.certification.ts', code);
