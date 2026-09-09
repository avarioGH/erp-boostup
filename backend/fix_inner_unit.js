const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
code = code.replace(/await prisma\.unit\.create\(\{ data: \{ id: '600000000000000000000301', company_id: c1, name: 'Unit' \} \}\);/g, "");
fs.writeFileSync('test/final.certification.ts', code);
