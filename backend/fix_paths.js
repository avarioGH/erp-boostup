const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
code = code.replace(/from '\.\/src\//g, "from '../src/");
fs.writeFileSync('test/final.certification.ts', code);
