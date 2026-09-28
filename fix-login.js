const fs = require('fs');
let code = fs.readFileSync('test-minimal.js', 'utf8');
code = code.replace(
  "const token = jwt.sign(\n    { userId: '6ab6bbbbda3dc137b74ac3df', sub: '6ab6bbbbda3dc137b74ac3df', email: 'uat_admin', roleId: '6ab6a254c7ee2dbcb45ff3b8', companyId: '6ab79d610c6db3e45bbdf53b' },\n    'uat_secret_49h_isolated',\n    { expiresIn: '1h' }\n  );",
  "const loginRes = await fetch('http://localhost:3001/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'uat_admin', password: 'UatPassword123!' }) }); const loginData = await loginRes.json(); const token = loginData.access_token;"
);
fs.writeFileSync('test-minimal.js', code);
