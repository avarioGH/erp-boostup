const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
code = code.replace(/email: 'sys@local'/g, "email: 'sys@local', username: 'system'");
fs.writeFileSync('test/final.certification.ts', code);
