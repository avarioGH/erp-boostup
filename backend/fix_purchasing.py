import re

with open('src/purchasing/purchasing.service.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "import { createFifoLayer } from '../inventory/fifo.engine';",
    "import { createFifoLayer } from '../inventory/fifo.engine';\nimport { InventoryService } from '../inventory/inventory.service';"
)

c = c.replace(
    "constructor(private prisma: PrismaService) {}",
    "constructor(private prisma: PrismaService, private inventoryService: InventoryService) {}"
)

old_logic = """        let stock = await tx.warehouseStock.findFirst({
          where: { company_id: companyId, warehouse_id: grn.warehouse_id, product_id: rItem.productId }
        });
        if (!stock) {
          stock = await tx.warehouseStock.create({
            data: { company_id: companyId, warehouse_id: grn.warehouse_id, product_id: rItem.productId, current_stock: 0, available_stock: 0 }
          });
        }

        await tx.warehouseStock.update({
            where: { id: stock.id },
            data: {
              current_stock: { increment: rItem.qty },
              available_stock: { increment: rItem.qty }
            }
          });

        const mov = await tx.stockMovement.create({
          data: {
            company_id: companyId,
            warehouse_id: grn.warehouse_id,
            product_id: rItem.productId,
            transaction_type: 'IN',
            transaction_id: grn.id,
            movement_type: 'PURCHASE_RECEIPT',
            qty_in: rItem.qty,
            qty_out: 0,
            balance_after: stock.current_stock + rItem.qty,
            unit_cost: poItem.unit_price,
            total_cost: poItem.unit_price * rItem.qty,
            created_by: (await tx.user.findFirst({where:{company_id:companyId}}))!.id
          }
        });
        
        await createFifoLayer(tx, {
          companyId: companyId,
          productId: rItem.productId,
          warehouseId: grn.warehouse_id,
          quantity: rItem.qty,
          unitCost: poItem.unit_price,
          stockMovementId: mov.id
        });"""

new_logic = """        await this.inventoryService.receiveStock(tx as any, {
          companyId,
          warehouseId: grn.warehouse_id,
          productId: rItem.productId,
          quantity: rItem.qty,
          unitCost: poItem.unit_price,
          referenceType: 'PURCHASE_RECEIPT',
          referenceId: grn.id,
          description: PO Receipt ,
          userId: (await tx.user.findFirst({where:{company_id:companyId}}))!.id
        });"""

c = c.replace(old_logic, new_logic)

with open('src/purchasing/purchasing.service.ts', 'w') as f:
    f.write(c)
