const fs = require('fs');

function replaceAll(file, search, replace) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  code = code.split(search).join(replace);
  fs.writeFileSync(file, code);
}

replaceAll('frontend/src/lib/api.ts', 'api.get(/sales/deliveries/$id)', 'api.get(`/sales/deliveries/${id}`)');
replaceAll('frontend/src/lib/api.ts', 'api.post(/sales/deliveries/$id/validate)', 'api.post(`/sales/deliveries/${id}/validate`)');
replaceAll('frontend/src/lib/api.ts', 'api.get(/finance/invoices/$id)', 'api.get(`/finance/invoices/${id}`)');
replaceAll('frontend/src/lib/api.ts', 'api.post(/finance/invoices/$id/post)', 'api.post(`/finance/invoices/${id}/post`)');
replaceAll('frontend/src/lib/api.ts', 'api.post(/purchasing/rfq/ + id + /confirm)', 'api.post(`/purchasing/rfq/${id}/confirm`)');
replaceAll('frontend/src/lib/api.ts', 'api.post(/purchasing/orders/ + poId + /receive, data)', 'api.post(`/purchasing/orders/${poId}/receive`, data)');

replaceAll('frontend/src/app/inventory/adjustments/page.tsx', 'api.post(/inventory/adjustment/ + id + /validate)', 'api.post(`/inventory/adjustment/${id}/validate`)');
replaceAll('frontend/src/app/inventory/transfers/page.tsx', 'api.post(/inventory/transfer/ + id + /validate)', 'api.post(`/inventory/transfer/${id}/validate`)');

