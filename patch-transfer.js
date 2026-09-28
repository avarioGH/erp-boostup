const fs = require('fs');
const path = '/root/erp-boostup/backend/src/inventory/stock-transfer.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "if (fromLocationId === toLocationId) throw new BadRequestException('Source and destination cannot be the same');",
  "if (!fromLocationId || !toLocationId) throw new BadRequestException('fromLocationId and toLocationId are required');\n      if (fromLocationId === toLocationId) throw new BadRequestException('Source and destination cannot be the same');"
);

fs.writeFileSync(path, code);
