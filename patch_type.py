with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("transaction_type: 'OUT'", "transaction_type: 'ECOMMERCE'")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
