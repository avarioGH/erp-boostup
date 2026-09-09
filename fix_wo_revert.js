const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Revert WorkOrder replacement
code = code.replace(/model WorkOrder \{\n  id String @id @default\(auto\(\)\) @map\("_id"\) @db\.ObjectId\n  company_id String @db\.ObjectId/g, 'model ManufacturingWorkOrder {\n  id String @id @default(auto()) @map("_id") @db.ObjectId\n  company_id String @db.ObjectId');

// Maintenance WorkOrder missing company_id?
// scheduling.service.ts(213,9): error TS2353: Object literal may only specify known properties, and 'company_id' does not exist in type 'WorkOrderWhereInput'.
// Ah! Maintenance WorkOrder is missing company_id! Let's add it.
code = code.replace(/model WorkOrder \{\n  id               String      @id @default\(auto\(\)\) @map\("_id"\) @db\.ObjectId\n  asset_id         String      @db\.ObjectId/g, 'model WorkOrder {\n  id               String      @id @default(auto()) @map("_id") @db.ObjectId\n  company_id String? @db.ObjectId\n  asset_id         String      @db.ObjectId');

// And missing planned_start, planned_end in WorkOrder (Maintenance)
code = code.replace(/assigned_to      String\?\n/g, 'assigned_to      String?\n  planned_start DateTime?\n  planned_end DateTime?\n');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
