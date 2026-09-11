with open("backend/src/ecommerce/ecommerce-checkout.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("c.quantity_consumed * c.unit_cost", "c.quantity * c.unit_cost")

with open("backend/src/ecommerce/ecommerce-checkout.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
