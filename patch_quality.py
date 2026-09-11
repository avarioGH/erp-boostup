with open("backend/src/manufacturing/quality/quality.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("// @ts-nocheck\n", "")

with open("backend/src/manufacturing/quality/quality.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
