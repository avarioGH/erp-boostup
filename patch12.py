with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    c = f.read()

import re
if "routing BomRouting?" not in c:
    c = re.sub(
        r'(model Bom \{[\s\S]*?)(^\})',
        r'\1  routing BomRouting?\n\2',
        c, flags=re.MULTILINE
    )

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(c)
