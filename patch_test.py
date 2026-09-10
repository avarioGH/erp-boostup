with open('backend/test/verify.erp.ts', 'r') as f:
    c = f.read()

c = c.replace(", type: 'STOCKED', is_stock: true, can_sell: true", "")

with open('backend/test/verify.erp.ts', 'w') as f:
    f.write(c)
