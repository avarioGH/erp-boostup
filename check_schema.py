with open('backend/prisma/schema.prisma', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find("model Unit {")
if idx != -1: print(c[idx:idx+300])

idx = c.find("model Category {")
if idx != -1: print(c[idx:idx+300])
