with open('test/verify.erp.ts', 'r') as f:
    c = f.read()

c = c.replace("../src/finance/gl/gl.service", "../src/gl/gl.service")
c = c.replace("type: 'ASSET'", "account_type: 'ASSET'")
c = c.replace("type: 'REVENUE'", "account_type: 'REVENUE'")
c = c.replace("start_date: new Date('2026-01-01')", "month: 1, year: 2026, start_date: new Date('2026-01-01')")
c = c.replace("code: 'P1', name: 'P1' }", "code: 'P1', name: 'P1', unit_id: new ObjectId().toHexString(), purchase_price: 10, selling_price: 20 }")

with open('test/verify.erp.ts', 'w') as f:
    f.write(c)
