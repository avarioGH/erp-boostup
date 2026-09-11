with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    schema = f.read()
schema = schema.replace(
    "category_id      String       @db.ObjectId\n  description",
    "category_id      String       @db.ObjectId\n  category         FinanceCategory @relation(fields: [category_id], references: [id], onDelete: NoAction, onUpdate: NoAction)\n  description"
)
with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(schema)
