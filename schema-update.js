const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

const disposalModels = `

model InventoryDisposal {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id      String   @db.ObjectId
  company         Company  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  warehouse_id    String   @db.ObjectId
  warehouse       Warehouse @relation(fields: [warehouse_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  disposal_number String
  disposal_date   DateTime
  status          String   // DRAFT, PENDING, APPROVED, REJECTED, COMPLETED, CANCELLED
  reason          String
  notes           String?
  
  created_by      String?  @db.ObjectId
  creator         User?    @relation("DisposalCreator", fields: [created_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
  approved_by     String?  @db.ObjectId
  approver        User?    @relation("DisposalApprover", fields: [approved_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  approved_at     DateTime?
  completed_at    DateTime?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  items           InventoryDisposalItem[]

  @@unique([company_id, disposal_number])
}

model InventoryDisposalItem {
  id              String             @id @default(auto()) @map("_id") @db.ObjectId
  disposal_id     String             @db.ObjectId
  disposal        InventoryDisposal  @relation(fields: [disposal_id], references: [id], onDelete: Cascade)
  product_id      String             @db.ObjectId
  product         Product            @relation(fields: [product_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  qty             Float
  unit            String?
  notes           String?
}
`;

// Add reverse relation to Company for disposal
schema = schema.replace(
  'products        Product[]',
  'products        Product[]\n  disposals       InventoryDisposal[]'
);

// Add reverse relation to Warehouse for disposal
schema = schema.replace(
  'stockMovements StockMovement[]',
  'stockMovements StockMovement[]\n  disposals      InventoryDisposal[]'
);

// Add reverse relation to Product for disposal items
schema = schema.replace(
  'stockInTallyItems         StockInTallyItem[]',
  'stockInTallyItems         StockInTallyItem[]\n  disposalItems             InventoryDisposalItem[]'
);

// Add reverse relation to User for disposal creator and approver
schema = schema.replace(
  'created_pos_shifts PosShift[] @relation("UserPosShifts")',
  'created_pos_shifts PosShift[] @relation("UserPosShifts")\n  created_disposals  InventoryDisposal[] @relation("DisposalCreator")\n  approved_disposals InventoryDisposal[] @relation("DisposalApprover")'
);

schema += disposalModels;
fs.writeFileSync('backend/prisma/schema.prisma', schema);
