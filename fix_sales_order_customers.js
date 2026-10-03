const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/sales/orders/create/page.tsx", "utf8");

content = content.replace("api.get('/master-data/customers')", "api.get('/customers')");

fs.writeFileSync("frontend/src/app/sales/orders/create/page.tsx", content);

