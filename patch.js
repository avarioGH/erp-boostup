const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

c = c.replace(
  'work_orders     ManufacturingWorkOrder[]\n}', 
  'work_orders     ManufacturingWorkOrder[]\n  is_active Boolean @default(true)\n  capacity_hours_per_day Float?\n  efficiency_percentage Float?\n  shift_start_time String?\n  shift_end_time String?\n}'
);

c = c.replace(
  'asset            AssetMaster @relation(fields: [asset_id], references: [id], onDelete: NoAction, onUpdate: NoAction)\n    wo_number        String      @unique',
  'asset            AssetMaster @relation(fields: [asset_id], references: [id], onDelete: NoAction, onUpdate: NoAction)\n    wo_number        String      @unique\n    planned_start DateTime?\n    planned_end DateTime?'
);

c = c.replace(
  'manufacturing_orders ManufacturingOrder[]\n    created_at      DateTime    @default(now())',
  'manufacturing_orders ManufacturingOrder[]\n    routing BomRouting?\n    created_at      DateTime    @default(now())'
);

c = c.replace(
  'operation_name  String\n    planned_start   DateTime?',
  'operation_name  String\n    reference String?\n    sequence Int @default(0)\n    planned_duration_minutes Float?\n    planned_start   DateTime?'
);

c = c.replace(
  'check_type      String\n    criteria        String\n    created_at      DateTime    @default(now())',
  'check_type      String\n    criteria        String\n    inspection_type String?\n    tolerance_min Float?\n    tolerance_max Float?\n    created_at      DateTime    @default(now())'
);

c = c.replace(
  'status          String\n    inspector_id    String?     @db.ObjectId\n    notes           String?\n    created_at      DateTime    @default(now())',
  'status          String\n    inspector_id    String?     @db.ObjectId\n    notes           String?\n    product_id      String?      @db.ObjectId\n    product         Product?     @relation(fields: [product_id], references: [id])\n    work_order_id   String?      @db.ObjectId\n    work_order      ManufacturingWorkOrder? @relation(fields: [work_order_id], references: [id])\n    quality_point_id String?    @db.ObjectId\n    quality_point   QualityControlPoint? @relation("QualityPointChecks", fields: [quality_point_id], references: [id])\n    inspected_quantity Float?\n    accepted_quantity Float?\n    rejected_quantity Float?\n    numeric_result Float?\n    checklist_result String?\n    inspection_date DateTime?\n    inspector      User?       @relation("QualityInspector", fields: [inspector_id], references: [id], onDelete: NoAction, onUpdate: NoAction)\n    dispositions   QualityDisposition[]\n    created_at      DateTime    @default(now())'
);

const extras = `
model QualityDisposition {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id       String   @db.ObjectId
  quality_check_id String   @db.ObjectId
  quality_check    QualityCheck @relation(fields: [quality_check_id], references: [id])
  type             String
  quantity         Float
  reason           String?
  defect_code      String?
  severity         String?
  user_id          String?  @db.ObjectId
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
}

model BomRouting {
  id         String @id @default(auto()) @map("_id") @db.ObjectId
  bom_id     String @unique @db.ObjectId
  bom        Bom    @relation(fields: [bom_id], references: [id])
  operations BomOperation[]
}

model BomOperation {
  id               String @id @default(auto()) @map("_id") @db.ObjectId
  routing_id       String @db.ObjectId
  routing          BomRouting @relation(fields: [routing_id], references: [id])
  work_center_id   String? @db.ObjectId
  sequence         Int
  operation_name   String
  setup_minutes    Float @default(0)
  standard_minutes Float @default(0)
}
`;

fs.writeFileSync('backend/prisma/schema.prisma', c + extras);
console.log('done');
