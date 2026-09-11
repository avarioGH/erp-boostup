with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("{ id: uC2Id, company_id: c2, username: 'c2admin', password_hash: 'x', role: 'FULL_ADMIN', status: 'ACTIVE' }", "{ id: uC2Id, company_id: c2, username: 'c2admin' + Date.now(), name: 'C2 Admin', password: 'x', status: true }")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
