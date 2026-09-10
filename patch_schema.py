with open('backend/prisma/schema.prisma', 'r') as f:
    c = f.read()

c = c.replace("required_quantity Float", "required_quantity Float\n  consumed_quantity Float? @default(0)")
c = c.replace("planned_quantity Float", "planned_quantity Float\n  produced_quantity Float? @default(0)\n  actual_start_date DateTime?\n  actual_end_date DateTime?")
c = c.replace("model MaterialReservation", "// model MaterialReservation")

with open('backend/prisma/schema.prisma', 'w') as f:
    f.write(c)

c = '''
model MaterialReservation {
  id              String      @id @default(auto()) @map("_id") @db.ObjectId
  company_id      String      @db.ObjectId
  manufacturing_order_id String @db.ObjectId
  manufacturing_order    ManufacturingOrder @relation(fields: [manufacturing_order_id], references: [id])
  product_id      String      @db.ObjectId
  warehouse_id    String      @db.ObjectId
  reserved_quantity Float
  consumed_quantity Float? @default(0)
  status          String
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt
}
'''
with open('backend/prisma/schema.prisma', 'a') as f:
    f.write(c)
