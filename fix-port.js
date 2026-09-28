const fs = require('fs');
let code = fs.readFileSync('test-minimal.js', 'utf8');
code = code.replace('localhost:5001', 'localhost:3001');
fs.writeFileSync('test-minimal.js', code);
