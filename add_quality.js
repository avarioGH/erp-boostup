const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

const qualityModels = \
model QualityControlPoint {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id      String   @db.ObjectId
  company         Company  @relation(fields: [company_id], references: [id], onDelete: Cascade)
  
  name            String
  product_id      String   @db.ObjectId
  product         Product  @relation(fields: [product_id], references: [id], onDelete: Cascade)
  
  operation_name  String?
  
  inspection_type String   
  
  tolerance_min   Float?
  tolerance_max   Float?
  unit            String?

  checklist_items String?  

  is_active       Boolean  @default(true)

  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  checks          QualityCheck[]
}

model QualityCheck {
  id                    String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id            String   @db.ObjectId
  company               Company  @relation(fields: [company_id], references: [id], onDelete: Cascade)
  
  quality_point_id      String?   @db.ObjectId
  quality_point         QualityControlPoint? @relation(fields: [quality_point_id], references: [id], onDelete: SetNull)

  manufacturing_order_id String? @db.ObjectId
  manufacturing_order    ManufacturingOrder? @relation(fields: [manufacturing_order_id], references: [id], onDelete: Cascade)
  
  work_order_id         String? @db.ObjectId
  work_order            ManufacturingWorkOrder? @relation(fields: [work_order_id], references: [id], onDelete: Cascade)

  product_id            String   @db.ObjectId
  product               Product  @relation("ProductQualityChecks", fields: [product_id], references: [id], onDelete: Cascade)

  inspector_id          String?  @db.ObjectId
  inspector             User?    @relation("InspectorQualityChecks", fields: [inspector_id], references: [id], onDelete: SetNull)

  status                String   @default("PENDING") 
  
  inspected_quantity    Float    @default(0)
  accepted_quantity     Float    @default(0)
  rejected_quantity     Float    @default(0)

  numeric_result        Float?
  checklist_result      String?  
  notes                 String?

  inspection_date       DateTime?

  dispositions          QualityDisposition[]

  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
}

model QualityDisposition {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id       String   @db.ObjectId
  company          Company  @relation(fields: [company_id], references: [id], onDelete: Cascade)

  quality_check_id String   @db.ObjectId
  quality_check    QualityCheck @relation(fields: [quality_check_id], references: [id], onDelete: Cascade)

  type             String   
  quantity         Float
  reason           String?
  defect_code      String?
  severity         String?  

  user_id          String?  @db.ObjectId
  user             User?    @relation("UserQualityDispositions", fields: [user_id], references: [id], onDelete: SetNull)

  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
}
\;

schema = schema + '\\n' + qualityModels;

// Add inverse relations manually
schema = schema.replace(/(model Company\s*\\{[\\s\\S]*?)(created_at\s+DateTime)/, \\ QualityControlPoint[]\\n  quality_checks QualityCheck[]\\n  quality_dispositions QualityDisposition[]\\n  \\);
schema = schema.replace(/(model Product\s*\\{[\\s\\S]*?)(created_at\s+DateTime)/, \\ QualityControlPoint[]\\n  quality_checks QualityCheck[] @relation("ProductQualityChecks")\\n  \\);
schema = schema.replace(/(model ManufacturingOrder\s*\\{[\\s\\S]*?)(created_at\s+DateTime)/, \\ QualityCheck[]\\n  \\);
schema = schema.replace(/(model ManufacturingWorkOrder\s*\\{[\\s\\S]*?)(created_at\s+DateTime)/, \\ QualityCheck[]\\n  \\);
schema = schema.replace(/(model User\s*\\{[\\s\\S]*?)(created_at\s+DateTime)/, \\ QualityCheck[] @relation("InspectorQualityChecks")\\n  quality_dispositions QualityDisposition[] @relation("UserQualityDispositions")\\n  \\);

fs.writeFileSync('backend/prisma/schema.prisma', schema, 'utf8');
