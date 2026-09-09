const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
code = code.replace(/_B/g, "");
code = code.replace(/600000000000000000000100', company_id: c2/g, "600000000000000000000111', company_id: c2");
fs.writeFileSync('test/final.certification.ts', code);
