const fs = require('fs');

function fix(file, badString, goodString) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  while (code.includes(badString)) {
    code = code.replace(badString, goodString);
  }
  fs.writeFileSync(file, code);
}

fix('frontend/src/lib/api.ts', 'api.get(/sales/deliveries/$id)', 'api.get(`/sales/deliveries/${id}`)');
fix('frontend/src/lib/api.ts', 'api.post(/sales/deliveries/$id/validate)', 'api.post(`/sales/deliveries/${id}/validate`)');
fix('frontend/src/lib/api.ts', 'api.get(/finance/invoices/$id)', 'api.get(`/finance/invoices/${id}`)');
fix('frontend/src/lib/api.ts', 'api.post(/finance/invoices/$id/post)', 'api.post(`/finance/invoices/${id}/post`)');
fix('frontend/src/lib/api.ts', 'api.post(/purchasing/rfq/ + id + /confirm)', 'api.post(`/purchasing/rfq/${id}/confirm`)');
fix('frontend/src/lib/api.ts', 'api.post(/purchasing/orders/ + poId + /receive, data)', 'api.post(`/purchasing/orders/${poId}/receive`, data)');

fix('frontend/src/app/inventory/adjustments/page.tsx', 'api.post(/inventory/adjustment/ + id + /validate)', 'api.post(`/inventory/adjustment/${id}/validate`)');
fix('frontend/src/app/inventory/transfers/page.tsx', 'api.post(/inventory/transfer/ + id + /validate)', 'api.post(`/inventory/transfer/${id}/validate`)');

