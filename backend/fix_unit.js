const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
code = code.replace(/'u1'/g, "'600000000000000000000301'");
code = code.replace(/'u2'/g, "'600000000000000000000302'");
fs.writeFileSync('test/final.certification.ts', code);
