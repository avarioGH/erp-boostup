
const fs = require("fs");
const content = fs.readFileSync("backend/src/crm/crm.service.ts", "utf8");
console.log(content.substring(content.indexOf("let totalSales = 0;"), content.indexOf("finance: {")));

