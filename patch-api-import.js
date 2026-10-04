const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/crm/partners/[id]/page.tsx', 'utf8');

if(!c.includes("import api from")) {
  c = c.replace(
    "import { CRMAPI, FinanceAPI } from '@/lib/api';",
    "import api, { CRMAPI, FinanceAPI } from '@/lib/api';"
  );
}

fs.writeFileSync('frontend/src/app/crm/partners/[id]/page.tsx', c);
