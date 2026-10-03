const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/inventory/movements/page.tsx", "utf8");

content = content.replace(/new Date\(m\.created_at \|\| Date\.now\(\)\)\.toLocaleDateString\('id-ID'\)/g, 
  `(() => { try { return new Date(m.created_at || Date.now()).toLocaleDateString("id-ID") } catch(e) { return "-" } })()`);

fs.writeFileSync("frontend/src/app/inventory/movements/page.tsx", content);

