with open("backend/src/hr/hr.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("// @ts-nocheck\n", "")
c = c.replace("// @ts-nocheck\r\n", "")
c = c.replace("// @ts-nocheck", "")

with open("backend/src/hr/hr.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
