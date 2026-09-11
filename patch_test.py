import re

with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = re.sub(r"items: \[\{ productId: p5, qty: 10, unitPrice: 500 \}\]", "items: [{ productId: p5, qty: 10, price: 500 }]", c)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
