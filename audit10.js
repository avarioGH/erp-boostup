
const fs = require("fs");
const content = fs.readFileSync("backend/src/purchasing/purchasing.service.ts", "utf8");
// Check vendor bill - does it create stock or AP invoice?
const idx = content.indexOf("async createVendorBill");
const section = content.substring(idx, idx + 2500);
console.log("VENDOR BILL SECTION:", section);

