with open('backend/prisma/schema.prisma', 'r') as f:
    c = f.read()

c = c.replace("warehouse_id    String      @db.ObjectId", "warehouse_id    String      @db.ObjectId\n  warehouse       Warehouse   @relation(fields: [warehouse_id], references: [id])")

with open('backend/prisma/schema.prisma', 'w') as f:
    f.write(c)

