const fs = require('fs');
const path = 'backend/prisma/schema.prisma';
let schema = fs.readFileSync(path, 'utf8');

if (!schema.includes('model ExportShipment')) {
  const newModels = `
// ==================================================
// EXPORT PACKING LIST (FISH & GENERAL)
// ==================================================

model ExportShipment {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id     String   @db.ObjectId
  company        Company  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  containerNo    String
  sealNo         String
  vehicleNo      String
  exportDate     DateTime
  status         String   @default("DRAFT")
  
  items          ExportShipmentItem[]
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model ExportShipmentItem {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  exportId       String   @db.ObjectId
  export         ExportShipment @relation(fields: [exportId], references: [id], onDelete: Cascade)
  
  groupName      String   // Supplier / Customer grouping (e.g. "PAK LUCKY")
  productName    String
  qtyKg          Float
  qtyMc          Int
  qtySak         Int

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
`;
  schema = schema + newModels;
  fs.writeFileSync(path, schema, 'utf8');
  console.log("Appended Export models to schema.");
} else {
  console.log("Models already exist.");
}
