const fs = require('fs');

let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

const transformationModels = `
model StockTransformation {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id      String   @db.ObjectId
  company         Company  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  transform_no    String   @unique
  date            DateTime @default(now())
  status          String   @default("COMPLETED") // DRAFT, COMPLETED, CANCELLED
  notes           String?
  created_by      String   @db.ObjectId
  user            User     @relation(fields: [created_by], references: [id], onDelete: NoAction, onUpdate: NoAction)

  inputs  StockTransformationInput[]
  outputs StockTransformationOutput[]

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}

model StockTransformationInput {
  id                String              @id @default(auto()) @map("_id") @db.ObjectId
  transformation_id String              @db.ObjectId
  transformation    StockTransformation @relation(fields: [transformation_id], references: [id], onDelete: Cascade)
  
  warehouse_id      String              @db.ObjectId
  warehouse         Warehouse           @relation(fields: [warehouse_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  product_id        String              @db.ObjectId
  product           Product             @relation(fields: [product_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  qty               Float
  unit_cost         Float               @default(0)
  total_cost        Float               @default(0)
}

model StockTransformationOutput {
  id                String              @id @default(auto()) @map("_id") @db.ObjectId
  transformation_id String              @db.ObjectId
  transformation    StockTransformation @relation(fields: [transformation_id], references: [id], onDelete: Cascade)
  
  warehouse_id      String              @db.ObjectId
  warehouse         Warehouse           @relation(fields: [warehouse_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  product_id        String              @db.ObjectId
  product           Product             @relation(fields: [product_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  qty               Float
  unit_cost         Float               @default(0)
  total_cost        Float               @default(0)
}
`;

if (!schema.includes('model StockTransformation {')) {
  schema += '\n' + transformationModels;
  fs.writeFileSync('backend/prisma/schema.prisma', schema);
  console.log('Added StockTransformation to schema.');
}
