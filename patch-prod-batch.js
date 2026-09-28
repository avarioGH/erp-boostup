const fs = require('fs');
const path = '/root/erp-boostup/backend/src/inventory/production/production.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "input.quantityPCS,\n          input.volumeM3\n        );",
  "input.quantityPCS,\n          input.volumeM3,\n          stock.batch\n        );"
);
code = code.replace(
  "output.quantityPCS,\n            output.volumeM3\n          );",
  "output.quantityPCS,\n            output.volumeM3,\n            process.processNo\n          );"
);

// Do the same for cancelProcess!
code = code.replace(
  "input.quantityPCS,\n          input.volumeM3\n        );",
  "input.quantityPCS,\n          input.volumeM3,\n          stock.batch\n        );"
);
code = code.replace(
  "output.quantityPCS,\n            output.volumeM3\n          );",
  "output.quantityPCS,\n            output.volumeM3,\n            process.processNo\n          );"
);

fs.writeFileSync(path, code);
