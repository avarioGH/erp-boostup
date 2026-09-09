const fs = require("fs");
let apiCode = fs.readFileSync("frontend/src/lib/api.ts", "utf8");

apiCode = apiCode.replace("api.get(/sales/deliveries/$id)", "api.get(`/sales/deliveries/${id}`)");
apiCode = apiCode.replace("api.post(/sales/deliveries/$id/validate)", "api.post(`/sales/deliveries/${id}/validate`)");
apiCode = apiCode.replace("api.get(/finance/invoices/$id)", "api.get(`/finance/invoices/${id}`)");
apiCode = apiCode.replace("api.post(/finance/invoices/$id/post)", "api.post(`/finance/invoices/${id}/post`)");
apiCode = apiCode.replace("api.post(/purchasing/rfq/ + id + /confirm)", "api.post(`/purchasing/rfq/${id}/confirm`)");
apiCode = apiCode.replace("api.post(/purchasing/orders/ + poId + /receive, data)", "api.post(`/purchasing/orders/${poId}/receive`, data)");

fs.writeFileSync("frontend/src/lib/api.ts", apiCode);

let code2 = fs.readFileSync("frontend/src/app/inventory/adjustments/page.tsx", "utf8");
code2 = code2.replace("api.post(/inventory/adjustment/ + id + /validate)", "api.post(`/inventory/adjustment/${id}/validate`)");
fs.writeFileSync("frontend/src/app/inventory/adjustments/page.tsx", code2);

let code3 = fs.readFileSync("frontend/src/app/inventory/transfers/page.tsx", "utf8");
code3 = code3.replace("api.post(/inventory/transfer/ + id + /validate)", "api.post(`/inventory/transfer/${id}/validate`)");
fs.writeFileSync("frontend/src/app/inventory/transfers/page.tsx", code3);

