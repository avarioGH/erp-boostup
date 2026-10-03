const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/crm/customers/[id]/page.tsx", "utf8");

content = content.replace(/toLocaleTanggalString/g, "toLocaleDateString");

fs.writeFileSync("frontend/src/app/crm/customers/[id]/page.tsx", content);

