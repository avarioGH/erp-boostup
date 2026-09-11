code = """
model BomRouting {
  id         String @id @default(auto()) @map("_id") @db.ObjectId
  bom_id     String @unique @db.ObjectId
  bom        Bom    @relation(fields: [bom_id], references: [id])
  operations BomOperation[]
}

model BomOperation {
  id               String @id @default(auto()) @map("_id") @db.ObjectId
  routing_id       String @db.ObjectId
  routing          BomRouting @relation(fields: [routing_id], references: [id])
  work_center_id   String? @db.ObjectId
  sequence         Int
  operation_name   String
  setup_minutes    Float @default(0)
  standard_minutes Float @default(0)
}
"""
with open("backend/prisma/schema.prisma", "a", encoding="utf-8") as f:
    f.write(code)

