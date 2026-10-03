const fs = require("fs");
let content = fs.readFileSync("backend/prisma/schema.prisma", "utf8");

const startIdx = content.indexOf("model Payment {");
const endStr = "@@unique([company_id, payment_number])\r\n}";
let endIdx = content.indexOf(endStr, startIdx);
if (endIdx === -1) {
  endIdx = content.indexOf("@@unique([company_id, payment_number])\n}", startIdx);
}
if (endIdx !== -1) {
  const oldText = content.substring(startIdx, endIdx + endStr.length);
  const newPaymentSchema = `model Payment {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id     String   @db.ObjectId
  company        Company  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  customer_id    String?  @db.ObjectId
  customer       Customer? @relation(fields: [customer_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  invoice_id     String?  @db.ObjectId
  invoice        Invoice? @relation(fields: [invoice_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  payment_number String
  payment_date   DateTime
  amount         Float
  payment_method String // CASH, BANK_TRANSFER, etc.
  reference      String?
  notes          String?

  created_by     String?  @db.ObjectId

  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?

  allocations    PaymentAllocation[]

  @@unique([company_id, payment_number])
}

model PaymentAllocation {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  payment_id      String      @db.ObjectId
  payment         Payment     @relation(fields: [payment_id], references: [id], onDelete: Cascade)
  sales_order_id  String?     @db.ObjectId
  sales_order     SalesOrder? @relation(fields: [sales_order_id], references: [id], onDelete: NoAction)
  invoice_id      String?     @db.ObjectId
  invoice         Invoice?    @relation(fields: [invoice_id], references: [id], onDelete: NoAction)
  amount          Float
  
  created_at      DateTime @default(now())
}`;
  content = content.replace(oldText, newPaymentSchema);
  
  content = content.replace("payment_status String? // UNPAID, PARTIAL, PAID", "payment_status String? // UNPAID, PARTIAL, PAID\n\n  allocations    PaymentAllocation[]");
  content = content.replace("company_name     String?", "company_name     String?\n  payments         Payment[]");
  fs.writeFileSync("backend/prisma/schema.prisma", content);
} else {
  console.log("Could not find end of Payment model");
}

