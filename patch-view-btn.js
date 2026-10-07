const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/purchasing/orders/page.tsx', 'utf8');

code = code.replace(/View\s*<\/Button>/g, "Lihat\n  </Button>");
fs.writeFileSync('frontend/src/app/purchasing/orders/page.tsx', code);
console.log('patched View button');
