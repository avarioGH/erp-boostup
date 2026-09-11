with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("selling_price: 200 }});", "selling_price: 200, status: true, is_published: true }});")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
