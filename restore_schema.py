c = '''
model Bom {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  company_id      String      @db.ObjectId
  product_id      String      @db.ObjectId
  code            String
  name            String
  quantity        Float
  unit_id         String      @db.ObjectId
  status          String
  items           BomItem[]
  manufacturing_orders ManufacturingOrder[]
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
}

model BomItem {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  bom_id          String      @db.ObjectId
  bom             Bom         @relation(fields: [bom_id], references: [id])
  product_id      String      @db.ObjectId
  quantity        Float
  unit_id         String      @db.ObjectId
}

model ManufacturingOrder {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  company_id      String      @db.ObjectId
  order_number    String
  product_id      String      @db.ObjectId
  bom_id          String      @db.ObjectId
  bom             Bom         @relation(fields: [bom_id], references: [id])
  warehouse_id    String      @db.ObjectId
  planned_quantity Float
  unit_id         String      @db.ObjectId
  status          String
  reservation_status String?
  items           ManufacturingOrderItem[]
  work_orders     ManufacturingWorkOrder[]
  quality_checks  QualityCheck[]
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
}

model ManufacturingOrderItem {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  manufacturing_order_id String @db.ObjectId
  manufacturing_order    ManufacturingOrder @relation(fields: [manufacturing_order_id], references: [id])
  product_id      String      @db.ObjectId
  required_quantity Float
  unit_id         String      @db.ObjectId
}

model WorkCenter {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  company_id      String      @db.ObjectId
  code            String
  name            String
  capacity_per_hour Float?
  cost_per_hour   Float?
  status          String
  work_orders     ManufacturingWorkOrder[]
}

model ManufacturingWorkOrder {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  company_id      String      @db.ObjectId
  manufacturing_order_id String @db.ObjectId
  manufacturing_order    ManufacturingOrder @relation(fields: [manufacturing_order_id], references: [id])
  work_center_id  String      @db.ObjectId
  work_center     WorkCenter  @relation(fields: [work_center_id], references: [id])
  operation_name  String
  planned_start   DateTime?
  planned_end     DateTime?
  status          String
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
}

model QualityControlPoint {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  company_id      String      @db.ObjectId
  product_id      String      @db.ObjectId
  operation_name  String
  check_type      String
  criteria        String
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
}

model QualityCheck {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  company_id      String      @db.ObjectId
  manufacturing_order_id String? @db.ObjectId
  manufacturing_order    ManufacturingOrder? @relation(fields: [manufacturing_order_id], references: [id])
  control_point_id String?    @db.ObjectId
  status          String
  inspector_id    String?     @db.ObjectId
  notes           String?
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
}
'''
with open('backend/prisma/schema.prisma', 'a') as f:
    f.write(c)
