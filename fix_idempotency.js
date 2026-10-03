const fs = require("fs");
let content = fs.readFileSync("backend/src/inventory/stock-in-tally.service.ts", "utf8");
content = content.replace("idempotency_key: data.idempotency_key,", "idempotency_key: data.idempotency_key || `TLY-${Date.now()}-${Math.floor(Math.random()*10000)}`,");
fs.writeFileSync("backend/src/inventory/stock-in-tally.service.ts", content);

