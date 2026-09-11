with open("backend/src/ecommerce/ecommerce-checkout.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("stockMovement: {", "stock_movement: {")

with open("backend/src/ecommerce/ecommerce-checkout.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
