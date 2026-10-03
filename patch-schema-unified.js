const fs = require('fs');

let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Add roles to Customer
if (!schema.includes('roles        String[]')) {
  schema = schema.replace(/model Customer \{/, `model Customer {\n    roles        String[]   @default(["CUSTOMER"])`);
}

// Ensure PurchaseOrder uses Customer instead of Supplier
// First, check if PurchaseOrder has supplier_id
if (schema.includes('supplier_id      String    @db.ObjectId')) {
  // We will change supplier_id to reference Customer!
  schema = schema.replace(/supplier_id      String    @db.ObjectId/, `supplier_id      String    @db.ObjectId`);
  schema = schema.replace(/supplier         Supplier  @relation\(fields: \[supplier_id\], references: \[id\], onDelete: NoAction, onUpdate: NoAction\)/, `supplier         Customer  @relation(fields: [supplier_id], references: [id], onDelete: NoAction, onUpdate: NoAction)`);
}

// In GoodsReceipt
if (schema.includes('supplier_id       String        @db.ObjectId')) {
  schema = schema.replace(/supplier          Supplier      @relation\(fields: \[supplier_id\], references: \[id\], onDelete: NoAction, onUpdate: NoAction\)/, `supplier          Customer      @relation(fields: [supplier_id], references: [id], onDelete: NoAction, onUpdate: NoAction)`);
}

// In SupplierProduct
if (schema.includes('supplier_id String   @db.ObjectId')) {
  schema = schema.replace(/supplier    Supplier @relation\(fields: \[supplier_id\], references: \[id\], onDelete: Cascade\)/, `supplier    Customer @relation(fields: [supplier_id], references: [id], onDelete: Cascade)`);
}

// Now delete Supplier model
schema = schema.replace(/model Supplier \{[\s\S]*?@@unique\(\[company_id, code\]\)\n\}/, '');

fs.writeFileSync('backend/prisma/schema.prisma', schema);
console.log('Schema updated to use Customer as unified Partner.');
