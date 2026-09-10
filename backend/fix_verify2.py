with open('test/verify.erp.ts', 'r') as f:
    c = f.read()

c = c.replace("../src/finance/gl.service", "../src/finance/accounting/gl.service")
c = c.replace("../src/auth/roles.guard", "../src/auth/permissions.guard")
c = c.replace("code: 'TC', ", "")
c = c.replace("code: '1000', ", "account_code: '1000', ")
c = c.replace("code: '4000', ", "account_code: '4000', ")
c = c.replace("name: 'Jan 2026', ", "period_name: 'Jan 2026', ")
c = c.replace("type: 'STOCKED', ", "")
c = c.replace("quantity: 100, referenceType", "quantity: 100, unitCost: 10, referenceType")

with open('test/verify.erp.ts', 'w') as f:
    f.write(c)
