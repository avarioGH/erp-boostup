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

old_logic = """        for (const item of delivery.items) {
          const stock = await tx.warehouseStock.findUnique({
            where: {
              company_id_warehouse_id_product_id: {
                company_id: companyId,
                warehouse_id: warehouse.id,
                product_id: item.product_id
              }
            }
          });

          if (stock) {
            const updateRes = await tx.warehouseStock.updateMany({
              where: { id: stock.id, available_stock: { gte: item.delivered_qty } },
              data: {
                current_stock: { decrement: item.delivered_qty },
                available_stock: { decrement: item.delivered_qty }
              }
            });
            if (updateRes.count === 0) {
              throw new BadRequestException('Concurrency conflict or insufficient stock for product ' + item.product_id);
            }

            const mov = await tx.stockMovement.create({
              data: {
                company_id: companyId,
                warehouse_id: warehouse.id,
                product_id: item.product_id,
                transaction_type: 'DELIVERY',
                transaction_id: delivery.id,
                movement_type: 'OUT',
                qty_in: 0,
                qty_out: item.delivered_qty,
                balance_after: stock.current_stock - item.delivered_qty,
                unit_cost: 0,
                total_cost: 0,
                created_by: '000000000000000000000999',
              }
            });

            // STEP 16.5D - TRUE FIFO CONSUMPTION
            const { totalCogs } = await consumeFifoLayers(tx, {
              companyId: companyId,
              productId: item.product_id,
              warehouseId: warehouse.id,
              quantity: item.delivered_qty,
              stockMovementId: mov.id
            });
            totalDeliveryCogs += totalCogs;

            const actual_unit_cost = item.delivered_qty > 0 ? totalCogs / item.delivered_qty : 0;
            await tx.stockMovement.update({
              where: { id: mov.id },
              data: { unit_cost: actual_unit_cost, total_cost: totalCogs }
            });
          }
        }"""

new_logic = """        for (const item of delivery.items) {
          if (item.delivered_qty > 0) {
            const issueRes = await this.inventoryService.issueStock(tx as any, {
              companyId,
              warehouseId: warehouse.id,
              productId: item.product_id,
              quantity: item.delivered_qty,
              referenceType: 'DELIVERY',
              referenceId: delivery.id,
              description: Delivery for SO ,
              userId: '000000000000000000000999'
            });
            totalDeliveryCogs += issueRes.consumedCost;
          }
        }"""

c = c.replace(old_logic, new_logic)

with open('src/crm/delivery/delivery.service.ts', 'w') as f:
    f.write(c)
