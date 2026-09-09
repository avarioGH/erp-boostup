const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('CheckoutIdempotency')) {
  schema += \nmodel CheckoutIdempotency {
  id                   String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id           String   @db.ObjectId
  ecommerce_session_id String
  sales_order_id       String   @db.ObjectId

  @@unique([company_id, ecommerce_session_id])
}\n;
  fs.writeFileSync('prisma/schema.prisma', schema);
}
