const fs = require('fs');
const path = 'backend/prisma/schema.prisma';
let schema = fs.readFileSync(path, 'utf8');

if (!schema.includes('exportShipments ExportShipment[]')) {
  const companyEnd = schema.lastIndexOf('@@unique([company_id, sku])');
  // Wait, let's just insert it before `@@unique([company_id, sku])` in Company model.
  // Actually Company model is huge.
  
  // Let's use a simple regex replacement:
  schema = schema.replace(
    'timberStockReservations TimberStockReservation[]\n    @@unique([company_id, sku])',
    'timberStockReservations TimberStockReservation[]\n    exportShipments ExportShipment[]\n    @@unique([company_id, sku])'
  );
  fs.writeFileSync(path, schema, 'utf8');
  console.log("Updated Company model.");
}
