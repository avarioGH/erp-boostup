const fs = require("fs");
let content = fs.readFileSync("backend/src/pos/pos.service.ts", "utf8");

content = content.replace("status: \"ACTIVE\"", "status: true, code: \"CUST-\" + Date.now()");

fs.writeFileSync("backend/src/pos/pos.service.ts", content);
console.log("FIXED");

