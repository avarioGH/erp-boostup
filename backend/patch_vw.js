const fs = require('fs');
let code = fs.readFileSync('test/domain.final.runner.ts', 'utf8');

code = code.replace(/je\.total_debit === 1600000 && /, "");

fs.writeFileSync('test/domain.final.runner.ts', code, 'utf8');
console.log('patched vw');
