const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/pos/new-transaction/page.tsx", "utf8");

content = content.replace("import { InventoryAPI, PosAPI }", "import { InventoryAPI, PosAPI, api }");

fs.writeFileSync("frontend/src/app/pos/new-transaction/page.tsx", content);

