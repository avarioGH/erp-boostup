with open("backend/src/ecommerce/ecommerce-checkout.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("userId: 'SYSTEM'", "userId: '6aa02dc075845f59e02b3f01'")

with open("backend/src/ecommerce/ecommerce-checkout.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
