import re

with open('src/crm/order.controller.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "import { SalesCompletedEvent } from '../events/sales-completed.event';",
    "import { SalesCompletedEvent } from '../events/sales-completed.event';\nimport { InventoryService } from '../inventory/inventory.service';"
)

c = c.replace(
    "constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2) {}",
    "constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2, private readonly inventoryService: InventoryService) {}"
)

old_logic = """          for (const item of orderItems) {
            // Find or create warehouse stock
            const stock = await tx.warehouseStock.findFirst({
              where: { warehouse_id: warehouse.id, product_id: item.product_id }
            });
            
            if (stock) {
              await tx.warehouseStock.update({
                where: { id: stock.id },
                data: {
                  current_stock: { decrement: item.qty },
                  available_stock: { decrement: item.qty }
                }
              });
            }
          }"""

new_logic = """          for (const item of orderItems) {
            await this.inventoryService.issueStock(tx as any, {
              companyId: req.user.company_id,
              warehouseId: warehouse.id,
              productId: item.product_id,
              quantity: item.qty,
              referenceType: 'SALE',
              referenceId: order.id,
              description: Sales Order ,
              userId: req.user.userId,
              allowNegative: true // to preserve previous best-effort behavior
            });
          }"""

c = c.replace(old_logic, new_logic)

with open('src/crm/order.controller.ts', 'w') as f:
    f.write(c)
