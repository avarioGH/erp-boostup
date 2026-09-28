const fs = require('fs');
let code = fs.readFileSync('test-minimal.js', 'utf8');
code = code.replace('7A9B3E2F8C1D4A6E5B8F9C2D1A4E7B0C', 'uat_secret_49h_isolated');
fs.writeFileSync('test-minimal.js', code);
