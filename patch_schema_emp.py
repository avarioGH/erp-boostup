with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    s = f.read()

s = s.replace(
    "employee_id         String        @db.ObjectId\n  claim_number",
    "employee_id         String        @db.ObjectId\n  employee            Employee      @relation(fields: [employee_id], references: [id], onDelete: Cascade)\n  claim_number"
)

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(s)
