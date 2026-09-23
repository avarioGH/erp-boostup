const fs = require('fs');
let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf-8');

// 1. Add relations to Company
const companyRegex = /model Company \{[\s\S]*?\}/;
content = content.replace(companyRegex, (match) => {
  if (match.includes('productionProcesses ProductionProcess[]')) return match;
  return match.replace(/}$/, `  productionProcesses ProductionProcess[]\n}`);
});

// 2. Add relation to TimberVariant
const variantRegex = /model TimberVariant \{[\s\S]*?\}/;
content = content.replace(variantRegex, (match) => {
  if (match.includes('productionInputs')) return match;
  return match.replace(/}$/, `  productionInputs ProductionProcessInput[]\n  productionOutputs ProductionProcessOutput[]\n}`);
});

// 3. Add relation to TimberStock
const timberStockRegex = /model TimberStock \{[\s\S]*?\}/;
content = content.replace(timberStockRegex, (match) => {
  if (match.includes('productionInputs')) return match;
  return match.replace(/}$/, `  productionInputs ProductionProcessInput[]\n}`);
});

// 4. Add relation to Warehouse
const warehouseRegex = /model Warehouse \{[\s\S]*?\}/;
content = content.replace(warehouseRegex, (match) => {
  if (match.includes('productionOutputs')) return match;
  return match.replace(/}$/, `  productionOutputs ProductionProcessOutput[]\n}`);
});

fs.writeFileSync('backend/prisma/schema.prisma', content);
console.log('Done extending existing models for production');
