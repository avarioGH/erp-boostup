const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

code = code.replace(/manufacturing_work_orders\s+WorkOrder\[\]/, 'manufacturing_work_orders ManufacturingWorkOrder[]');
code = code.replace(/work_orders\s+WorkOrder\[\]/g, 'work_orders ManufacturingWorkOrder[]');

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

addFieldToModel('Product', 'purchase_request_items PurchaseRequestItem[]');
addFieldToModel('Unit', 'purchase_request_items PurchaseRequestItem[]');
addFieldToModel('QualityControlPoint', 'quality_checks QualityCheck[]');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
