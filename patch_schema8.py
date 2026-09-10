with open('backend/prisma/schema.prisma', 'r') as f:
    c = f.read()

c = c.replace("model MaterialReservation {\n  id", "model MaterialReservation {\n  id")
c = c.replace("warehouse_id    String      @db.ObjectId\n  reserved_quantity", "warehouse_id    String      @db.ObjectId\n  warehouse       Warehouse   @relation(fields: [warehouse_id], references: [id])\n  reserved_quantity")

with open('backend/prisma/schema.prisma', 'w') as f:
    f.write(c)

