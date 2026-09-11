import re

with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    c = f.read()

# AssetMaster
c = c.replace("WorkOrder[]\n}", "WorkOrder[]\n  work_center_id String? @db.ObjectId\n  work_center WorkCenter? @relation(fields: [work_center_id], references: [id])\n}")

# WorkOrder
c = c.replace("cost            Float  @default(0)", "cost            Float  @default(0)\n  planned_start DateTime?\n  planned_end DateTime?")

# Bom
c = c.replace("manufacturing_orders ManufacturingOrder[]", "manufacturing_orders ManufacturingOrder[]\n  routing BomRouting?")

# WorkCenter
c = c.replace("work_orders     ManufacturingWorkOrder[]\n}", "work_orders     ManufacturingWorkOrder[]\n  is_active Boolean @default(true)\n  capacity_hours_per_day Float?\n  efficiency_percentage Float?\n  shift_start_time String?\n  shift_end_time String?\n  asset_masters AssetMaster[]\n}")

# ManufacturingWorkOrder
c = c.replace("operation_name  String", "operation_name  String\n  reference String?\n  sequence Int @default(0)\n  planned_duration_minutes Float?")

# QualityControlPoint
c = c.replace("updated_at      DateTime    @updatedAt\n}", "updated_at      DateTime    @updatedAt\n  quality_checks QualityCheck[]\n  inspection_type String?\n  tolerance_min Float?\n  tolerance_max Float?\n}")

# QualityCheck
qc_replace = """    notes           String?
    product_id      String?      @db.ObjectId
    product         Product?     @relation(fields: [product_id], references: [id])
    work_order_id   String?      @db.ObjectId
    work_order      ManufacturingWorkOrder? @relation(fields: [work_order_id], references: [id])
    quality_point_id String?    @db.ObjectId
    quality_point   QualityControlPoint? @relation(fields: [quality_point_id], references: [id])
    inspected_quantity Float?
    accepted_quantity Float?
    rejected_quantity Float?
    numeric_result Float?
    checklist_result String?
    inspection_date DateTime?
    inspector      User?       @relation("QualityInspector", fields: [inspector_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
    dispositions   QualityDisposition[]
"""
c = c.replace("notes           String?", qc_replace)


additions = """
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
"""

c += additions

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(c)

