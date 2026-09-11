with open('backend/src/pos/pos.service.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace manual stock update with issueStock
import re

c = c.replace("import { consumeFifoLayers } from '../inventory/fifo.engine';", "import { InventoryService } from '../inventory/inventory.service';")

# Add to constructor
c = re.sub(r'constructor\(private prisma: PrismaService, private eventEmitter: EventEmitter2\) \{\}', 'constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2, private inventoryService: InventoryService) {}', c)

replacement = """
          if (warehouseId) {
            const issueRes = await this.inventoryService.issueStock(tx as any, {
              companyId,
              warehouseId,
              productId: item.productId,
              quantity: item.qty,
              referenceType: 'POS_SALE',
              referenceId: salesOrder.id,
              description: `POS Sale ${soNo}`,
              userId: userId || '000000000000000000000000'
            });
            totalPosCogs += issueRes.totalCogs;
          }
"""

# Replace the block from `if (warehouseId) {` to `} // STEP 16.5... }`
c = re.sub(r'if \(warehouseId\) \{.*?totalPosCogs \+= totalCogs;.*?\}', replacement, c, flags=re.DOTALL)

with open('backend/src/pos/pos.service.ts', 'w', encoding='utf-8') as f:
    f.write(c)
