const fs = require('fs');
const path = '/root/erp-boostup/backend/src/inventory/production/production.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'quantityPCS: input.quantityPCS,',
  'quantityPCS: input.quantityPCS ?? input.quantityPcs,'
);
code = code.replace(
  'variantId: input.variantId,',
  'variantId: input.variantId ?? input.timberVariantId,'
);
code = code.replace(
  'quantityPCS: output.quantityPCS,',
  'quantityPCS: output.quantityPCS ?? output.quantityPcs,'
);
code = code.replace(
  'variantId: output.variantId,',
  'variantId: output.variantId ?? output.timberVariantId,'
);
code = code.replace(
  'warehouseId: output.warehouseId',
  'warehouseId: output.warehouseId ?? output.locationId'
);

fs.writeFileSync(path, code);
