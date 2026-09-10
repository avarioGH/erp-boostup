import re

with open('src/manufacturing/mo/mo.service.ts', 'r') as f:
    c = f.read()

c = re.sub(
    r"constructor\(\s*private readonly prisma: PrismaService,\s*private readonly eventEmitter: EventEmitter2,\s*\)",
    r"constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2, private readonly inventoryService: InventoryService)",
    c
)

with open('src/manufacturing/mo/mo.service.ts', 'w') as f:
    f.write(c)

