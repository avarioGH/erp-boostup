with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    c = f.read()

import re

# AssetMaster
c = re.sub(
    r'(model AssetMaster \{\n)',
    r'\1  work_center_id String? @db.ObjectId\n  work_center WorkCenter? @relation("WorkCenterAssets", fields: [work_center_id], references: [id])\n',
    c
)

# QualityCheck: we might have forgotten dispositions or spelt it wrong? Let's verify:
if 'dispositions   QualityDisposition[]' not in c:
    c = re.sub(
        r'(model QualityCheck \{[\s\S]*?)(^\})',
        r'\1  dispositions QualityDisposition[]\n\2',
        c, flags=re.MULTILINE
    )

# Bom: add routing if not exists
if 'routing BomRouting?' not in c:
    c = re.sub(
        r'(model Bom \{[\s\S]*?)(^\})',
        r'\1  routing BomRouting?\n\2',
        c, flags=re.MULTILINE
    )

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(c)

