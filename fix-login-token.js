const fs = require('fs');
let code = fs.readFileSync('test-minimal.js', 'utf8');
code = code.replace('const token = loginData.access_token;', 'console.log(\'LOGIN_RES\', loginData); const token = loginData.data ? loginData.data.access_token : loginData.access_token;');
fs.writeFileSync('test-minimal.js', code);
