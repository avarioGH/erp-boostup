with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

import re

c = c.replace(
"const payload = { reference: 'T-REF-1', merchant_ref: mRef, status: 'PAID', amount: 400 };",
"const invX = await prisma.invoice.findUnique({ where: { id: invId } });\n    const payload = { reference: 'T-REF-1', merchant_ref: mRef, status: 'PAID', amount: invX!.total };"
)

# And for H9 check:
c = c.replace("assertEq(debits, 400, 'H9 exact amount reconciled');", "assertEq(debits, Number(invX!.total), 'H9 exact amount reconciled');")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
