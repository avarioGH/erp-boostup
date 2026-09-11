code = """
model QualityDisposition {
  id               String   @id @default(auto()) @map("_id") @db.ObjectId
  company_id       String   @db.ObjectId
  quality_check_id String   @db.ObjectId
  quality_check    QualityCheck @relation(fields: [quality_check_id], references: [id])
  type             String
  quantity         Float
  reason           String?
  defect_code      String?
  severity         String?
  user_id          String?  @db.ObjectId
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt
}
"""
with open("backend/prisma/schema.prisma", "a", encoding="utf-8") as f:
    f.write(code)

import re
with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    c = f.read()

if "dispositions QualityDisposition[]" not in c:
    c = re.sub(
        r'(model QualityCheck \{[\s\S]*?)(^\})',
        r'\1  dispositions QualityDisposition[]\n\2',
        c, flags=re.MULTILINE
    )

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(c)
