const fs = require('fs');
let lines = fs.readFileSync('src/app/inventory/products/page.tsx', 'utf8').split('\n');
lines.splice(359, 1); // 0-indexed, so 359 is line 360
fs.writeFileSync('src/app/inventory/products/page.tsx', lines.join('\n'));
