with open("backend/src/inventory/inventory.service.ts", "r", encoding="utf-8") as f:
    c = f.read()
idx = c.find("async createInbound(data")
if idx != -1: print(c[idx:idx+2500])
