const fs = require('fs');
const path = 'frontend/src/app/crm/whatsapp/page.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(/title="Putuskan Koneksi"/g, '');
fs.writeFileSync(path, code);
console.log('Fixed typescript error');
