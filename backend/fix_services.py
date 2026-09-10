with open('src/crm/delivery/delivery.service.ts', 'r') as f:
    c = f.read()

c = c.replace("import { InventoryService } from '../../inventory/inventory.service';\nimport { InventoryService } from '../../inventory/inventory.service';", "import { InventoryService } from '../../inventory/inventory.service';")

with open('src/crm/delivery/delivery.service.ts', 'w') as f:
    f.write(c)

with open('src/ecommerce/ecommerce-checkout.service.ts', 'r') as f:
    c = f.read()

c = c.replace("constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}", "constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2, private inventoryService: InventoryService) {}")

with open('src/ecommerce/ecommerce-checkout.service.ts', 'w') as f:
    f.write(c)
