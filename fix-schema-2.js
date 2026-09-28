const fs = require('fs');
let s = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// 1. Add company_id to TimberVariant
s = s.replace('model TimberVariant {\n  sawmillOutputItems SawmillOutputItem[]\n  id              String                   @id @default(auto()) @map("_id") @db.ObjectId', 'model TimberVariant {\n  sawmillOutputItems SawmillOutputItem[]\n  id              String                   @id @default(auto()) @map("_id") @db.ObjectId\n  company_id      String                   @db.ObjectId\n  company         Company                  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)');

// 2. Add @@unique([company_id, sku]) to TimberVariant
// Let's find end of TimberVariant
const tvMatch = s.match(/model TimberVariant \{[\s\S]*?\n\}/);
if (tvMatch) {
  const tvBlock = tvMatch[0];
  const newTvBlock = tvBlock.replace(/\n\}$/, '\n  @@unique([company_id, sku])\n}');
  s = s.replace(tvBlock, newTvBlock);
}

// 3. Add salesOrderItemId to TimberShipmentItem
const tsiMatch = s.match(/model TimberShipmentItem \{[\s\S]*?\n\}/);
if (tsiMatch) {
  const tsiBlock = tsiMatch[0];
  const newTsiBlock = tsiBlock.replace(/\n\}$/, '\n  salesOrderItemId String?                @db.ObjectId\n  salesOrderItem   TimberSalesOrderItem?  @relation(fields: [salesOrderItemId], references: [id])\n}');
  s = s.replace(tsiBlock, newTsiBlock);
}

// 4. Add timberShipmentItems to TimberSalesOrderItem
const tsoiMatch = s.match(/model TimberSalesOrderItem \{[\s\S]*?\n\}/);
if (tsoiMatch) {
  const tsoiBlock = tsoiMatch[0];
  const newTsoiBlock = tsoiBlock.replace(/\n\}$/, '\n  timberShipmentItems TimberShipmentItem[]\n}');
  s = s.replace(tsoiBlock, newTsoiBlock);
}

fs.writeFileSync('backend/prisma/schema.prisma', s);
console.log('Fixed');
