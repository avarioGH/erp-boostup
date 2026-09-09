const fs = require('fs');

let api = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');

api = api.split('api.get(/sales/quotations/$id)').join('api.get(`/sales/quotations/${id}`)');
api = api.split('api.post(/sales/quotations/$id/confirm)').join('api.post(`/sales/quotations/${id}/confirm`)');
api = api.split('api.get(/sales/orders/$id)').join('api.get(`/sales/orders/${id}`)');
api = api.split('api.get(/sales/deliveries/$id)').join('api.get(`/sales/deliveries/${id}`)');
api = api.split('api.post(/sales/deliveries/$id/validate)').join('api.post(`/sales/deliveries/${id}/validate`)');
api = api.split('api.get(/finance/invoices/$id)').join('api.get(`/finance/invoices/${id}`)');
api = api.split('api.post(/finance/invoices/$id/post)').join('api.post(`/finance/invoices/${id}/post`)');
api = api.split('api.post(/purchasing/rfq/ + id + /confirm)').join('api.post(`/purchasing/rfq/${id}/confirm`)');
api = api.split('api.post(/purchasing/orders/ + poId + /receive, data)').join('api.post(`/purchasing/orders/${poId}/receive`, data)');

fs.writeFileSync('frontend/src/lib/api.ts', api);

let invAdj = fs.readFileSync('frontend/src/app/inventory/adjustments/page.tsx', 'utf8');
invAdj = invAdj.split('api.post(/inventory/adjustment/ + id + /validate)').join('api.post(`/inventory/adjustment/${id}/validate`)');
fs.writeFileSync('frontend/src/app/inventory/adjustments/page.tsx', invAdj);

let invTrans = fs.readFileSync('frontend/src/app/inventory/transfers/page.tsx', 'utf8');
invTrans = invTrans.split('api.post(/inventory/transfer/ + id + /validate)').join('api.post(`/inventory/transfer/${id}/validate`)');
fs.writeFileSync('frontend/src/app/inventory/transfers/page.tsx', invTrans);

