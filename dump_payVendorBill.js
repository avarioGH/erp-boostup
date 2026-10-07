
const fs = require("fs");
const content = fs.readFileSync("backend/src/purchasing/purchasing.service.ts", "utf8");
console.log(content.substring(content.indexOf("async payVendorBill"), content.indexOf("async payVendorBill") + 1000));

