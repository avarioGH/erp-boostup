const fs = require('fs');

['backend/src/finance/netting/netting.service.ts', 'backend/src/inventory/fish-purchase/fish-purchase.service.ts'].forEach(file => {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/nestjs-prisma/g, '../../prisma/prisma.service');
  // fix any type errors found in the previous build
  c = c.replace(/const apList = \[\];/g, 'const apList: any[] = [];');
  c = c.replace(/const arList = \[\];/g, 'const arList: any[] = [];');
  fs.writeFileSync(file, c);
});

console.log('Fixed types in netting');
