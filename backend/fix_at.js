const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');
code = code.replace(/name: 'Asset', normal_balance: 'DEBIT'/g, "name: 'Asset', normal_balance: 'DEBIT', code: 'ASSET'");
fs.writeFileSync('test/final.certification.ts', code);
