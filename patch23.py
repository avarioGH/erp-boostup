import re
with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    'model WorkOrder {\n    id               String      @id @default(auto()) @map("_id") @db.ObjectId\n    asset_id',
    'model WorkOrder {\n    id               String      @id @default(auto()) @map("_id") @db.ObjectId\n    company_id String @db.ObjectId\n    asset_id'
)

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(c)

