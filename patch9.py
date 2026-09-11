import re

with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    c = f.read()

c = re.sub(
    r'(model WorkCenter \{[\s\S]*?)(^\})',
    r'\1  capacity_hours_per_day Float?\n  efficiency_percentage Float?\n  shift_start_time String?\n  shift_end_time String?\n\2',
    c, flags=re.MULTILINE
)

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(c)

with open("backend/src/manufacturing/quality/quality.service.ts", "r", encoding="utf-8") as f:
    qc = f.read()
# Replace ALL tx.qualityDisposition with (tx as any)['qualityDisposition']
qc = re.sub(r'tx\.qualityDisposition\.create', r"(tx as any)['qualityDisposition'].create", qc)
qc = qc.replace("(tx as any).qualityDisposition.create", "(tx as any)['qualityDisposition'].create")
with open("backend/src/manufacturing/quality/quality.service.ts", "w", encoding="utf-8") as f:
    f.write(qc)

