const fs = require('fs');
let code = fs.readFileSync('test-minimal.js', 'utf8');
code = code.replace("email: 'uat_admin'", "username: 'uat_admin'");
fs.writeFileSync('test-minimal.js', code);
