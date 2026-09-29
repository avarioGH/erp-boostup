const fs = require('fs');
const path = 'frontend/src/app/sales/orders/create/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { B2BApi, InventoryAPI } from \"@/lib/api\"",
  "import { B2BApi, InventoryAPI, api } from \"@/lib/api\""
);

content = content.replace(
  "fetch('/api/master-data/customers').then(res => res.json())",
  "api.get('/master-data/customers').then(res => res.data)"
);

fs.writeFileSync(path, content, 'utf8');
