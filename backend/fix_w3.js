const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
code = code.replace(/w1\.replace\('1','2'\)/g, "'600000000000000000000023'");
fs.writeFileSync('test/final.certification.ts', code);
