const fs = require('fs');
let code = fs.readFileSync('test/final.certification.ts', 'utf8');

code = code.replace(/company_id: comp, warehouse_id: wh, product_id: prod/g, "company_id: c1, warehouse_id: w1, product_id: p1");

fs.writeFileSync('test/final.certification.ts', code);
