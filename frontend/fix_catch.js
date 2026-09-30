const fs = require('fs');
let code = fs.readFileSync('src/app/inventory/products/page.tsx', 'utf8');
code = code.replace(/catch \(error\) {\s*console\.error\("Failed to save product:/g, 'catch (error: any) { console.error("Failed to save product:');
fs.writeFileSync('src/app/inventory/products/page.tsx', code);
