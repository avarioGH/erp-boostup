const fs = require('fs');

let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Fix Invoice ambiguous relations
schema = schema.replace(
  /customer\s+Customer\?\s+@relation\(fields: \[customer_id\], references: \[id\], onDelete: NoAction, onUpdate: NoAction\)/,
  'customer       Customer?   @relation("InvoiceCustomer", fields: [customer_id], references: [id], onDelete: NoAction, onUpdate: NoAction)'
);

schema = schema.replace(
  /supplier\s+Customer\?\s+@relation\(fields: \[supplier_id\], references: \[id\], onDelete: NoAction, onUpdate: NoAction\)/,
  'supplier       Customer?   @relation("InvoiceSupplier", fields: [supplier_id], references: [id], onDelete: NoAction, onUpdate: NoAction)'
);

// Add the opposite relations to Customer model
schema = schema.replace(
  /invoices\s+Invoice\[\]/,
  'invoices_as_customer Invoice[] @relation("InvoiceCustomer")\n    invoices_as_supplier Invoice[] @relation("InvoiceSupplier")'
);

fs.writeFileSync('backend/prisma/schema.prisma', schema);
console.log('Fixed Invoice relations.');
