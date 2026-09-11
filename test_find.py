with open('backend/src/pos/pos.service.ts', 'r', encoding='utf-8') as f:
    c = f.read()
print(c.find("if (warehouseId) {"))
