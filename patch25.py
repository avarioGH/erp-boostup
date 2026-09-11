import re
with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "let res = // skip O1-O3 RBAC",
    "// skip O1-O3 RBAC"
)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
