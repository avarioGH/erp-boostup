const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/crm/customers/[id]/page.tsx", "utf8");

content = content.replace(/new Tanggal/g, "new Date");

fs.writeFileSync("frontend/src/app/crm/customers/[id]/page.tsx", content);

