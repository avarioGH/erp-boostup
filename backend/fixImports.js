const fs = require('fs');
let c = fs.readFileSync('test/phase8.5.certification.ts', 'utf8');
c = c.replace(/from '\.\/src\//g, "from '../src/");
fs.writeFileSync('test/phase8.5.certification.ts', c);
console.log('Fixed imports');
