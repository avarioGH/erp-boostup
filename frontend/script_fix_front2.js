const fs = require('fs');

function fixApi(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Manual targeted replaces for api.ts
  code = code.replace(/api\.get\(\/sales\/deliveries\/\$id\)/g, "api.get(`/sales/deliveries/${id}`)");
  code = code.replace(/api\.post\(\/sales\/deliveries\/\$id\/validate\)/g, "api.post(`/sales/deliveries/${id}/validate`)");
  code = code.replace(/api\.get\(\/finance\/invoices\/\$id\)/g, "api.get(`/finance/invoices/${id}`)");
  code = code.replace(/api\.post\(\/finance\/invoices\/\$id\/post\)/g, "api.post(`/finance/invoices/${id}/post`)");
  code = code.replace(/api\.post\(\/purchasing\/rfq\/\s*\+\s*id\s*\+\s*\/confirm\)/g, "api.post(`/purchasing/rfq/${id}/confirm`)");
  code = code.replace(/api\.post\(\/purchasing\/orders\/\s*\+\s*poId\s*\+\s*\/receive,\s*data\)/g, "api.post(`/purchasing/orders/${poId}/receive`, data)");

  fs.writeFileSync(file, code);
}

function fixInvAdj(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/api\.post\(\/inventory\/adjustment\/\s*\+\s*id\s*\+\s*\/validate\)/g, "api.post(`/inventory/adjustment/${id}/validate`)");
  fs.writeFileSync(file, code);
}

function fixInvTrans(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/api\.post\(\/inventory\/transfer\/\s*\+\s*id\s*\+\s*\/validate\)/g, "api.post(`/inventory/transfer/${id}/validate`)");
  fs.writeFileSync(file, code);
}

fixApi('frontend/src/lib/api.ts');
fixInvAdj('frontend/src/app/inventory/adjustments/page.tsx');
fixInvTrans('frontend/src/app/inventory/transfers/page.tsx');

