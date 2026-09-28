const fs = require('fs');
let code = fs.readFileSync('test-minimal.js', 'utf8');
code = code.replace(/adj\.data\.id/g, "adj.id");
code = code.replace(/trf\.data\.id/g, "trf.id");
code = code.replace(/prd\.data\.id/g, "prd.id");
fs.writeFileSync('test-minimal.js', code);
