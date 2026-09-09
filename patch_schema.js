const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Revert the bad change to InvoiceItem
code = code.replace(
  /invoice_id\s+String\?\s+@db\.ObjectId[\s\S]*?expense_claim_id String\? @db\.ObjectId\s+expense_claim ExpenseClaim\? @relation\(fields: \[expense_claim_id\], references: \[id\], onDelete: NoAction, onUpdate: NoAction\)/g,
  "invoice_id String @db.ObjectId\n  invoice Invoice @relation(fields: [invoice_id], references: [id], onDelete: NoAction, onUpdate: NoAction)"
);

// Specifically target Payment
code = code.replace(
  /model Payment \{[\s\S]*?invoice_id String @db\.ObjectId\s*invoice Invoice @relation\(fields: \[invoice_id\], references: \[id\], onDelete: NoAction, onUpdate: NoAction\)/,
  \model Payment {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id     String   @db.ObjectId
  company        Company  @relation(fields: [company_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  invoice_id     String?  @db.ObjectId
  invoice        Invoice? @relation(fields: [invoice_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
  expense_claim_id String? @db.ObjectId
  expense_claim  ExpenseClaim? @relation(fields: [expense_claim_id], references: [id], onDelete: NoAction, onUpdate: NoAction)\
);

fs.writeFileSync('backend/prisma/schema.prisma', code, 'utf8');
