const fs = require('fs');
let c = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');
const appendStr = `
model Netting {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id     String   @db.ObjectId
  company        Company  @relation(fields: [company_id], references: [id])
  partner_id     String   @db.ObjectId
  partner        Customer @relation(fields: [partner_id], references: [id])
  netting_number String
  date           DateTime
  amount         Float
  notes          String?
  status         String   @default("COMPLETED") // COMPLETED, REVERSED
  created_by     String?  @db.ObjectId

  allocations    NettingAllocation[]
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt
  
  @@unique([company_id, netting_number])
}

model NettingAllocation {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  netting_id String   @db.ObjectId
  netting    Netting  @relation(fields: [netting_id], references: [id], onDelete: Cascade)
  invoice_id String   @db.ObjectId
  invoice    Invoice  @relation(fields: [invoice_id], references: [id], onDelete: NoAction)
  type       String   // "AR" or "AP"
  amount     Float
  
  created_at DateTime @default(now())
}
`;

// Insert after PaymentAllocation
c = c.replace(
  "  created_at DateTime @default(now())\n}", 
  "  created_at DateTime @default(now())\n}" + appendStr
);

fs.writeFileSync('backend/prisma/schema.prisma', c);
