with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("jwtView", "tokenNone")
c = c.replace("jwtC2", "tokenC2")

# Inject tokenC2 definition
idx = c.find("await verify('RBAC', 'M1 - No JWT Inventory'")
if idx != -1:
    c = c[:idx] + "const tokenC2 = jwtService.sign({ sub: new ObjectId().toHexString(), company_id: c2, role: 'FULL_ADMIN' });\n  " + c[idx:]

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
