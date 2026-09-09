const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

function fixModelRelation(modelName, badStr, goodStr) {
  const marker = "model " + modelName + " {";
  const lines = code.split('\n');
  let inModel = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === marker) {
      inModel = true;
    }
    if (inModel && lines[i].includes(badStr)) {
      lines[i] = lines[i].replace(badStr, goodStr);
    }
    if (inModel && lines[i].trim() === '}') {
      break;
    }
  }
  code = lines.join('\n');
}

fixModelRelation('Company', 'manufacturing_work_orders WorkOrder[]', 'manufacturing_work_orders ManufacturingWorkOrder[]');
fixModelRelation('ManufacturingOrder', 'work_orders WorkOrder[]', 'work_orders ManufacturingWorkOrder[]');
fixModelRelation('WorkCenter', 'work_orders WorkOrder[]', 'work_orders ManufacturingWorkOrder[]');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
