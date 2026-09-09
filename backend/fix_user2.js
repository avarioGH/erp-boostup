const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
code = code.replace(/username: 'system'/g, "username: 'system', password: 'x'");
fs.writeFileSync('test/final.certification.ts', code);
