const fs = require('fs');
let c = fs.readFileSync('backend/src/inventory/fish-processing/fish-processing.service.ts', 'utf8');
c = c.replace(/reqUser\.company_id/g, "(reqUser.company_id || reqUser.companyId)");
fs.writeFileSync('backend/src/inventory/fish-processing/fish-processing.service.ts', c);
