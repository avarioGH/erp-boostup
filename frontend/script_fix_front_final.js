const fs = require('fs');

let code = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');

code = code.replace(/api\.get\(\/([a-zA-Z0-9_\-\/]+)\/\$id\)/g, 'api.get(`/$1/${id}`)');
code = code.replace(/api\.post\(\/([a-zA-Z0-9_\-\/]+)\/\$id\/([a-zA-Z0-9_\-\/]+)\)/g, 'api.post(`/$1/${id}/$2`)');
code = code.replace(/api\.post\(\/purchasing\/rfq\/\s*\+\s*id\s*\+\s*\/confirm\)/g, 'api.post(`/purchasing/rfq/${id}/confirm`)');
code = code.replace(/api\.post\(\/purchasing\/orders\/\s*\+\s*poId\s*\+\s*\/receive,\s*data\)/g, 'api.post(`/purchasing/orders/${poId}/receive`, data)');

fs.writeFileSync('frontend/src/lib/api.ts', code);

let invAdj = fs.readFileSync('frontend/src/app/inventory/adjustments/page.tsx', 'utf8');
invAdj = invAdj.replace(/api\.post\(\/inventory\/adjustment\/\s*\+\s*id\s*\+\s*\/validate\)/g, 'api.post(`/inventory/adjustment/${id}/validate`)');
fs.writeFileSync('frontend/src/app/inventory/adjustments/page.tsx', invAdj);

let invTrans = fs.readFileSync('frontend/src/app/inventory/transfers/page.tsx', 'utf8');
invTrans = invTrans.replace(/api\.post\(\/inventory\/transfer\/\s*\+\s*id\s*\+\s*\/validate\)/g, 'api.post(`/inventory/transfer/${id}/validate`)');
fs.writeFileSync('frontend/src/app/inventory/transfers/page.tsx', invTrans);

