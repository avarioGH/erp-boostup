const fs = require('fs');
let code = fs.readFileSync('test-minimal.js', 'utf8');
code = code.replace(
  "const data = await res.json();",
  "const text = await res.text(); let data; try { data = JSON.parse(text); } catch (e) { data = text; } console.log(method, path, res.status, text);"
);
fs.writeFileSync('test-minimal.js', code);
