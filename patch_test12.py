with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

import re

new_code = """const roleFullC2Id = new ObjectId().toHexString();
  await prisma.role.create({ data: { id: roleFullC2Id, company_id: c2, name: 'FULL_ADMIN' }});
  const uC2Id = new ObjectId().toHexString();
  await prisma.user.create({ data: { id: uC2Id, company_id: c2, username: 'c2admin' + Date.now(), name: 'C2 Admin', password: 'x', role_id: roleFullC2Id, status: true } });
  const tokenC2 = jwt!.sign({ sub: uC2Id, company_id: c2, role: 'FULL_ADMIN' });"""

c = re.sub(r"const uC2Id = new ObjectId\(\)\.toHexString\(\);\s*await prisma\.user\.create\(\{ data: \{ id: uC2Id.*?\}\} \);\s*const tokenC2 = jwt!\.sign\(\{ sub: uC2Id, company_id: c2, role: 'FULL_ADMIN' \}\);", new_code, c, flags=re.DOTALL)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
