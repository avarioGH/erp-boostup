with open("backend/src/inventory/inventory.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("for (const item of data.items) {", "for (const item of data.items) {\n          if (item.qty <= 0) throw new BadRequestException('Quantity must be greater than 0');")

with open("backend/src/inventory/inventory.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
