
const fs = require("fs");
const content = fs.readFileSync("backend/src/inventory/inventory.service.ts", "utf8");
const start = content.indexOf("async issueStock(");
const end = content.indexOf("async transferStock(", start);
console.log(content.substring(start, end));

