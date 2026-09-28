const fs = require('fs');
let code = fs.readFileSync('test-minimal.js', 'utf8');
code = code.replace("UatPassword123!", "uatpassword");
fs.writeFileSync('test-minimal.js', code);
