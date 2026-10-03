const fs = require("fs");
let content = fs.readFileSync("frontend/src/app/sales/orders/create/page.tsx", "utf8");

content = content.replace(/<Input type="number" min="1"/g, `<Input type="number" step="any" min="0"`);
// Also need to parse it as float instead of just any or parseInt
// Actually the onChange handles e.target.value which is a string. The backend parses it.
fs.writeFileSync("frontend/src/app/sales/orders/create/page.tsx", content);

