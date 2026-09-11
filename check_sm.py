with open('backend/prisma/schema.prisma', 'r', encoding='utf-8') as f:
    c = f.read()
idx = c.find("model StockMovement {")
if idx != -1: print(c[idx:idx+800])
