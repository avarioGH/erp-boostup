with open('backend/src/pos/pos.service.ts', 'r', encoding='utf-8') as f:
    c = f.read()

start_idx = c.find("if (warehouseId) {")
end_idx = c.find("      // 3. Finance Transaction (Add Revenue)")

if start_idx != -1 and end_idx != -1:
    replacement = """if (warehouseId) {
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
      }

"""
    c = c[:start_idx] + replacement + c[end_idx:]

c = c.replace("import { consumeFifoLayers } from '../inventory/fifo.engine';", "import { InventoryService } from '../inventory/inventory.service';")
c = c.replace("constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2) {}", "constructor(private prisma: PrismaService, private eventEmitter: EventEmitter2, private inventoryService: InventoryService) {}")

with open('backend/src/pos/pos.service.ts', 'w', encoding='utf-8') as f:
    f.write(c)
