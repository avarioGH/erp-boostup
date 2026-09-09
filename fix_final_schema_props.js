const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Quality
code = code.replace(/check_id\s+String\s+@db\.ObjectId/, 'quality_check_id String @db.ObjectId');
code = code.replace(/inspected_by String\?/, 'inspected_by String?\n  inspected_quantity Float @default(0)\n  rejected_quantity Float @default(0)');
code = code.replace(/control_point_id String\? @db\.ObjectId/, 'control_point_id String? @db.ObjectId\n  quality_point QualityControlPoint? @relation(fields: [control_point_id], references: [id])');

// WorkCenter
code = code.replace(/is_active\s+Boolean\s+@default\(true\)/, 'is_active Boolean @default(true)\n  capacity_hours_per_day Float @default(8)\n  efficiency_percentage Float @default(100)');

// WorkOrder
code = code.replace(/model ManufacturingWorkOrder \{/g, 'model WorkOrder {');
code = code.replace(/work_orders\s+ManufacturingWorkOrder\[\]/g, 'work_orders WorkOrder[]');
code = code.replace(/work_orders\s+ManufacturingWorkOrder/g, 'work_orders WorkOrder');

// RoutingOperation
code = code.replace(/setup_time_minutes\s+Float\s+@default\(0\)/, 'setup_minutes Float @default(0)');
code = code.replace(/duration_minutes\s+Float\s+@default\(0\)/, 'standard_minutes Float @default(0)');
code = code.replace(/name\s+String\n\s+sequence\s+Int/g, 'operation_name String\n  sequence Int');

// MaterialReservation
code = code.replace(/quantity\s+Float\n\s+status\s+String/, 'reserved_quantity Float\n  status String\n  manufacturing_order_item_id String? @db.ObjectId');

// Notification
code = code.replace(/type\s+String/, 'type String\n  entity_type String?');

// PurchaseRequest
code = code.replace(/pr_number\s+String/, 'request_number String');
code = code.replace(/items\s+Json/, 'items PurchaseRequestItem[]');
code = code.replace(/model PurchaseRequest \{/, 'model PurchaseRequestItem {\n  id String @id @default(auto()) @map("_id") @db.ObjectId\n  purchase_request_id String @db.ObjectId\n  purchase_request PurchaseRequest @relation(fields: [purchase_request_id], references: [id], onDelete: Cascade)\n  product_id String @db.ObjectId\n  product Product @relation(fields: [product_id], references: [id], onDelete: NoAction, onUpdate: NoAction)\n  quantity Float\n  unit_id String @db.ObjectId\n  unit Unit @relation(fields: [unit_id], references: [id], onDelete: NoAction, onUpdate: NoAction)\n  notes String?\n}\n\nmodel PurchaseRequest {');
code = code.replace(/@@unique\(\[company_id, pr_number\]\)/, '@@unique([company_id, request_number])');

// SupplierProduct
code = code.replace(/lead_time_days Int\?/, 'lead_time_days Int?\n  minimum_order_qty Float @default(1)');
code = code.replace(/is_active\s+Boolean\s+@default\(true\)/, 'active Boolean @default(true)');

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
