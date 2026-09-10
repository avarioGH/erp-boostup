import re

with open('src/crm/delivery/delivery.service.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "import { consumeFifoLayers } from '../../inventory/fifo.engine';",
    "import { consumeFifoLayers } from '../../inventory/fifo.engine';\nimport { InventoryService } from '../../inventory/inventory.service';"
)

c = c.replace(
    "constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}",
    "constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2, private inventoryService: InventoryService) {}"
)

c = re.sub(
    r"const stock = await tx\.warehouseStock\.findUnique.*?data: \{ unit_cost: actual_unit_cost, total_cost: totalCogs \}\s*\n\s*\}[^}]*\}",
    r"""const issueRes = await this.inventoryService.issueStock(tx as any, {
              companyId, warehouseId: warehouse.id, productId: item.product_id, quantity: item.delivered_qty, referenceType: 'DELIVERY', referenceId: delivery.id, description: 'Delivery for SO ' + so.order_number, userId: '000000000000000000000999'
            });
            totalDeliveryCogs += issueRes.consumedCost;
          }""",
    c,
    flags=re.DOTALL
)

with open('src/crm/delivery/delivery.service.ts', 'w') as f:
    f.write(c)
