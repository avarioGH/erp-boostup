
const fs = require("fs");
const content = fs.readFileSync("backend/src/inventory/stock-adjustment.service.ts", "utf8");
console.log(content.substring(0, 4000));

