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

addFieldToModel('MaintenanceLog', 'company_id String? @db.ObjectId');
addFieldToModel('WorkOrder', 'downtime_minutes Float?');
addFieldToModel('ManufacturingOrder', 'reservation_status String?');
addFieldToModel('MaterialReservation', 'released_at DateTime?');
addFieldToModel('QualityCheck', 'quality_point_id String?');
addFieldToModel('QualityCheck', 'accepted_quantity Float?');
addFieldToModel('QualityDisposition', 'type String?');
addFieldToModel('ManufacturingWorkOrder', 'operation_operation_name String?');
addFieldToModel('Notification', 'entity_id String?');
addFieldToModel('PurchaseRequest', 'source String?');
addFieldToModel('PurchaseRequest', 'required_date DateTime?');
addFieldToModel('QualityCheck', 'manufacturing_order_id String?'); // Ah, it already has it?

// Wait, QualityCheck error: Property 'manufacturing_order' does not exist on type QualityCheck Include.
// QualityCheck needs relation to ManufacturingOrder!
code = code.replace(/manufacturing_order_id\s+String\?\s+@db\.ObjectId/, 'manufacturing_order_id String? @db.ObjectId\n  manufacturing_order ManufacturingOrder? @relation(fields: [manufacturing_order_id], references: [id])');
// And QualityCheck relation to Product
code = code.replace(/product_id\s+String\s+@db\.ObjectId/, 'product_id String @db.ObjectId\n  product Product? @relation(fields: [product_id], references: [id])');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
