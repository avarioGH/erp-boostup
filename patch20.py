import re

with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "shift_end_time String?",
    "shift_end_time String?\n  is_active Boolean @default(true)"
)

# For QualityCheck
qc_extras = """
  product_id      String?      @db.ObjectId
  product         Product?     @relation(fields: [product_id], references: [id])
  work_order_id   String?      @db.ObjectId
  work_order      ManufacturingWorkOrder? @relation(fields: [work_order_id], references: [id])
"""

c = re.sub(
    r'(model QualityCheck \{[\s\S]*?)(^\})',
    r'\1' + qc_extras + r'\2',
    c, flags=re.MULTILINE
)

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(c)

