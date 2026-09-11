import re
with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    c = f.read()

c = re.sub(
    r'(model WorkOrder \{[\s\S]*?)(^\})',
    r'\1  company_id String? @db.ObjectId\n\2',
    c, flags=re.MULTILINE
)

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(c)

