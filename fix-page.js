const fs = require('fs');
const path = 'frontend/src/app/page.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(/Penjualan Hari Ini/g, 'Penjualan Bulan Ini');
fs.writeFileSync(path, code);
console.log('Fixed page.tsx');
