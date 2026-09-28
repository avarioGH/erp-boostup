const fs = require('fs');
const path = '/root/erp-boostup/backend/src/inventory/shipment/shipment.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'totalVolumeM3 += item.volumeM3;',
  'totalVolumeM3 += (item.quantityPcs * variant.volumePerPiece);'
);

code = code.replace(
  'volumeM3: item.volumeM3,',
  'volumeM3: item.quantityPcs * variant.volumePerPiece,'
);

fs.writeFileSync(path, code);
