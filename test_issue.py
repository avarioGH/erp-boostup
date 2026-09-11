with open('backend/src/inventory/inventory.service.ts', 'r', encoding='utf-8') as f:
    c = f.read()
idx = c.find("async issueStock(")
print(c[idx:idx+1500])
