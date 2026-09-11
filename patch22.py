import re
with open("backend/prisma/schema.prisma", "r", encoding="utf-8") as f:
    c = f.read()

if "quality_checks QualityCheck[]" not in c.split("model Product {")[1].split("}")[0]:
    c = re.sub(
        r'(model Product \{[\s\S]*?)(^\})',
        r'\1  quality_checks QualityCheck[]\n\2',
        c, flags=re.MULTILINE
    )

if "quality_checks QualityCheck[]" not in c.split("model ManufacturingWorkOrder {")[1].split("}")[0]:
    c = re.sub(
        r'(model ManufacturingWorkOrder \{[\s\S]*?)(^\})',
        r'\1  quality_checks QualityCheck[]\n\2',
        c, flags=re.MULTILINE
    )

with open("backend/prisma/schema.prisma", "w", encoding="utf-8") as f:
    f.write(c)
