with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("jwt.sign({ sub: new ObjectId().toHexString(), company_id: c2, role: 'FULL_ADMIN' });", "jwt!.sign({ sub: new ObjectId().toHexString(), company_id: c2, role: 'FULL_ADMIN' });")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
