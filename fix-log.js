const fs = require('fs');
let code = fs.readFileSync('test-minimal.js', 'utf8');
code = code.replace(/const trf = await req/g, "const trf = await req");
code = code.replace("await req('/inventory/transfers/' + trf.id + '/post'", "console.log('trf', trf); await req('/inventory/transfers/' + trf.id + '/post'");
fs.writeFileSync('test-minimal.js', code);
