with open("backend/src/purchasing/purchasing.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("this.prisma.purchaseRequest.create as any", "(this.prisma.purchaseRequest as any).create")

with open("backend/src/purchasing/purchasing.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
