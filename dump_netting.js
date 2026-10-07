
const fs = require("fs");
const content = fs.readFileSync("backend/src/finance/netting/netting.service.ts", "utf8");
console.log(content.substring(content.indexOf("async applyNetting"), content.indexOf("async getPartnerBalance")));

