with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    schema = f.read()

schema = schema.replace(
    "model Attendance {\n  company_id String? @db.ObjectId\n  employee_id String    @db.ObjectId",
    "model Attendance {\n  id          String    @id @default(auto()) @map(\"_id\") @db.ObjectId\n  company_id  String?   @db.ObjectId\n  employee_id String    @db.ObjectId"
)

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(schema)
