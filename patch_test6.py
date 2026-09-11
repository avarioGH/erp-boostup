with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("jwtService.sign", "jwt.sign")
c = c.replace("module: 'InventoryService'", "entity: 'InventoryTransaction'")
c = c.replace("module: 'SalesOrder'", "entity: 'SalesOrder'")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
