const fs = require('fs');
const path = '/root/erp-boostup/backend/src/inventory/stock-adjustment.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'physicalPcs: item.physicalPcs,',
  'physicalPcs: item.physicalPcs ?? (item.systemPcs + item.differencePcs),'
);

fs.writeFileSync(path, code);
