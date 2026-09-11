with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "name: 'Test Product', code: 'P01', selling_price: 10000, purchase_price: 5000000, category_id",
    "name: 'Test Product', code: 'P01', selling_price: 10000, purchase_price: 5000000, unit_id: new ObjectId().toHexString(), category_id"
)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)

