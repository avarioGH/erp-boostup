
const fs = require("fs");
const content = fs.readFileSync("backend/src/purchasing/purchasing.service.ts", "utf8");
const start = content.indexOf("async createVendorBill");
const end = content.indexOf("async payVendorBill", start);
console.log(content.substring(start, end));

