with open('backend/prisma/schema.prisma', 'r') as f:
    c = f.read()

c = c.replace("product_id      String      @db.ObjectId", "product_id      String      @db.ObjectId\n  product         Product     @relation(fields: [product_id], references: [id])")
c = c.replace("produced_quantity Float? @default(0)", "produced_quantity Float @default(0)")
c = c.replace("consumed_quantity Float? @default(0)", "consumed_quantity Float @default(0)")
c = c.replace("status          String\n  created_at      DateTime    @default(now())", "status          String\n  released_at     DateTime?\n  manufacturing_order_item_id String? @db.ObjectId\n  created_at      DateTime    @default(now())")

with open('backend/prisma/schema.prisma', 'w') as f:
    f.write(c)
