const fs = require('fs');
let file = 'backend/src/ai/ai.service.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('s.product?.sku', 's.product?.code');
fs.writeFileSync(file, content);
