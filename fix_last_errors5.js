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

addFieldToModel('Company', 'quality_checks QualityCheck[]');
addFieldToModel('QualityControlPoint', 'quality_checks QualityCheck[]');
addFieldToModel('Product', 'quality_checks QualityCheck[]');
addFieldToModel('ManufacturingOrder', 'quality_checks QualityCheck[]');

// Ensure Product and ManufacturingOrder have opposite relations inside QualityCheck
// Wait, I already added product Product @relation in fix_last_errors2.js
// And manufacturing_order ManufacturingOrder? @relation in fix_last_errors.js

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
