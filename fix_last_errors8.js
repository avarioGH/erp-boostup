const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

function addFieldToModel(modelName, fieldDefinition) {
  const marker = "model " + modelName + " {";
  const lines = code.split('\n');
  let inModel = false;
  let alreadyHas = false;
  const fieldName = fieldDefinition.split(' ')[0].trim();
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === marker) {
      inModel = true;
    }
    if (inModel && lines[i].trim().startsWith(fieldName + ' ')) {
      alreadyHas = true;
    }
    if (inModel && lines[i].trim() === '}') {
      if (!alreadyHas) {
        lines.splice(i, 0, "  " + fieldDefinition);
      }
      break;
    }
  }
  code = lines.join('\n');
}

addFieldToModel('QualityCheck', 'product Product @relation(fields: [product_id], references: [id])');
addFieldToModel('QualityCheck', 'manufacturing_order ManufacturingOrder? @relation(fields: [manufacturing_order_id], references: [id])');
addFieldToModel('Product', 'material_reservations MaterialReservation[]');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
