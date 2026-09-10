with open('backend/test/verify.erp.ts', 'r') as f:
    c = f.read()

c = c.replace("name: 'Product A' }", "name: 'Product A', unit_id: new ObjectId().toHexString(), purchase_price: 10, selling_price: 20 }")

with open('backend/test/verify.erp.ts', 'w') as f:
    f.write(c)
