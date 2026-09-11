import re

with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Fix M3 to use tokenAdmin
c = c.replace("await request(app.getHttpServer()).get('/inventory/products').set('Authorization', 'Bearer ' + tokenNone);", "await request(app.getHttpServer()).get('/inventory/products').set('Authorization', 'Bearer ' + tokenAdmin);")

# Inject User creation for c2
user_c2 = """const uC2Id = new ObjectId().toHexString();
  await prisma.user.create({ data: { id: uC2Id, company_id: c2, username: 'c2admin', password_hash: 'x', role: 'FULL_ADMIN', status: 'ACTIVE' } });
  const tokenC2 = jwt!.sign({ sub: uC2Id, company_id: c2, role: 'FULL_ADMIN' });"""

c = re.sub(r"const tokenC2 = jwt!\.sign\(\{ sub: new ObjectId\(\)\.toHexString\(\), company_id: c2, role: 'FULL_ADMIN' \}\);", user_c2, c)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
