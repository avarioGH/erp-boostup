const fs = require('fs');
const path = 'backend/src/sales/timber-sales.module.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('ExportShipmentController')) {
  content = content.replace(
    'import { TimberSalesController } from "./timber-sales.controller";',
    'import { TimberSalesController } from "./timber-sales.controller";\nimport { ExportShipmentController } from "./export-shipment.controller";\nimport { ExportShipmentService } from "./export-shipment.service";'
  ).replace(
    'controllers: [TimberSalesController]',
    'controllers: [TimberSalesController, ExportShipmentController]'
  ).replace(
    'providers: [TimberSalesService]',
    'providers: [TimberSalesService, ExportShipmentService]'
  ).replace(
    'exports: [TimberSalesService]',
    'exports: [TimberSalesService, ExportShipmentService]'
  );
  fs.writeFileSync(path, content, 'utf8');
}
