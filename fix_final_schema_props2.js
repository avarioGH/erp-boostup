const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

code = code.replace(/model WorkCenter \{\n  id String @id @default\(auto\(\)\) @map\("_id"\) @db\.ObjectId/g, 'model WorkCenter {\n  id String @id @default(auto()) @map("_id") @db.ObjectId\n  capacity_hours_per_day Float @default(8)\n  efficiency_percentage Float @default(100)');
code = code.replace(/model WorkOrder \{\n  id               String      @id @default\(auto\(\)\) @map\("_id"\) @db\.ObjectId\n  company_id String\? @db\.ObjectId/g, 'model WorkOrder {\n  id               String      @id @default(auto()) @map("_id") @db.ObjectId\n  company_id String? @db.ObjectId\n  planned_start DateTime?\n  planned_end DateTime?');
code = code.replace(/model ManufacturingWorkOrder \{\n  id String @id @default\(auto\(\)\) @map\("_id"\) @db\.ObjectId/g, 'model ManufacturingWorkOrder {\n  id String @id @default(auto()) @map("_id") @db.ObjectId\n  operation_name String?');
code = code.replace(/model Notification \{\n  id           String   @id @default\(auto\(\)\) @map\("_id"\) @db\.ObjectId/g, 'model Notification {\n  id           String   @id @default(auto()) @map("_id") @db.ObjectId\n  entity_type String?');
code = code.replace(/model PurchaseRequest \{\n  id           String   @id @default\(auto\(\)\) @map\("_id"\) @db\.ObjectId/g, 'model PurchaseRequest {\n  id           String   @id @default(auto()) @map("_id") @db.ObjectId\n  required_date DateTime?');
code = code.replace(/is_active    Boolean  @default\(true\)/g, 'active    Boolean  @default(true)');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
