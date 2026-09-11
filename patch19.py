import re
with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "await prisma.chartOfAccount.create({ data: { company_id: c1, code: '1200', name: 'Piutang Usaha', type: 'ASSET', normal_balance: 'DEBIT', is_active: true } });",
    "await prisma.chartOfAccount.create({ data: { company_id: c1, code: '1200', name: 'Piutang Usaha', type: 'ASSET', normal_balance: 'DEBIT', is_active: true } });\n    await prisma.chartOfAccount.create({ data: { company_id: c1, code: '1400', name: 'Barang Dalam Proses', type: 'ASSET', normal_balance: 'DEBIT', is_active: true } });"
)

# And fix RBAC route to match actual API route
c = c.replace("await request(app.getHttpServer()).get('/manufacturing/boms');", "await request(app.getHttpServer()).get('/boms');")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)

