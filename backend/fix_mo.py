import re

with open('src/manufacturing/mo/mo.service.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "import { consumeFifoLayers, createFifoLayer } from '../../inventory/fifo.engine';",
    "import { consumeFifoLayers, createFifoLayer } from '../../inventory/fifo.engine';\nimport { InventoryService } from '../../inventory/inventory.service';"
)

c = c.replace(
    "constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2) {}",
    "constructor(private readonly prisma: PrismaService, private readonly eventEmitter: EventEmitter2, private readonly inventoryService: InventoryService) {}"
)

# 1. reserveMaterials
old_res = """        const resUpd = await tx.warehouseStock.updateMany({
          where: {
            id: stock.id,
            available_stock: { gte: neededQty },
          },
          data: {
            available_stock: { decrement: neededQty },
            reserved_stock: { increment: neededQty },
          },
        });

        if (resUpd.count === 0) {
          throw new BadRequestException(Concurrency conflict reserving stock);
        }"""

new_res = """        try {
          await this.inventoryService.reserveStock(tx as any, {
            companyId: company_id,
            productId: item.product_id,
            quantity: neededQty,
            warehouseId: mo.warehouse_id
          });
        } catch(e: any) {
          throw new BadRequestException(Concurrency conflict reserving stock);
        }"""

c = c.replace(old_res, new_res)

# 2. cancelProduction
old_cancel = """        await tx.warehouseStock.update({
          where: {
            company_id_warehouse_id_product_id: {
              company_id,
              warehouse_id: res.warehouse_id,
              product_id: res.product_id,
            },
          },
          data: {
            reserved_stock: { decrement: res.reserved_quantity },
            available_stock: { increment: res.reserved_quantity },
          },
        });"""

new_cancel = """        await this.inventoryService.releaseReservation(tx as any, {
          companyId: company_id,
          warehouseId: res.warehouse_id,
          productId: res.product_id,
          quantity: res.reserved_quantity
        });"""

c = c.replace(old_cancel, new_cancel)

# 3. recordConsumption
old_cons = """        const unreservedConsumption =
          reqItem.quantity - qtyToReleaseFromReservation;

        await tx.warehouseStock.update({
          where: { id: stock.id },
          data: {
            current_stock: { decrement: reqItem.quantity },
            reserved_stock: { decrement: qtyToReleaseFromReservation },
            available_stock: { decrement: unreservedConsumption },
          },
        });

        await tx.manufacturingOrderItem.update({
          where: { id: moItem.id },
          data: { consumed_quantity: { increment: reqItem.quantity } },
        });

        const mov = await tx.stockMovement.create({
          data: {
            company_id,
            warehouse_id: mo.warehouse_id,
            product_id: moItem.product_id,
            transaction_type: 'MANUFACTURING',
            transaction_id: mo.id,
            movement_type: 'MANUFACTURING_CONSUMPTION',
            qty_in: 0,
            qty_out: reqItem.quantity,
            balance_after: stock.current_stock - reqItem.quantity,
            unit_cost: 0,
            total_cost: 0,
            created_by: user_id,
            reference_number: mo.order_number,
            remarks: Consumed for MO ,
          },
        });

        const { totalCogs } = await consumeFifoLayers(tx as any, {
          companyId: company_id,
          productId: moItem.product_id,
          warehouseId: mo.warehouse_id,
          quantity: reqItem.quantity,
          stockMovementId: mov.id
        });

        await tx.stockMovement.update({
          where: { id: mov.id },
          data: { unit_cost: reqItem.quantity > 0 ? totalCogs / reqItem.quantity : 0, total_cost: totalCogs }
        });"""

new_cons = """        if (qtyToReleaseFromReservation > 0) {
          await this.inventoryService.releaseReservation(tx as any, {
             companyId: company_id,
             warehouseId: mo.warehouse_id,
             productId: moItem.product_id,
             quantity: qtyToReleaseFromReservation
          });
        }
        
        await tx.manufacturingOrderItem.update({
          where: { id: moItem.id },
          data: { consumed_quantity: { increment: reqItem.quantity } },
        });

        await this.inventoryService.issueStock(tx as any, {
           companyId: company_id,
           warehouseId: mo.warehouse_id,
           productId: moItem.product_id,
           quantity: reqItem.quantity,
           referenceType: 'MANUFACTURING_CONSUMPTION',
           referenceId: mo.id,
           description: Consumed for MO ,
           userId: user_id
        });"""

c = c.replace(old_cons, new_cons)


# 4. recordProduction
old_prod = """      let stock = await tx.warehouseStock.findUnique({
        where: {
          company_id_warehouse_id_product_id: {
            company_id,
            warehouse_id: mo.warehouse_id,
            product_id: mo.product_id,
          },
        },
      });

      if (!stock) {
        stock = await tx.warehouseStock.create({
          data: {
            company_id,
            warehouse_id: mo.warehouse_id,
            product_id: mo.product_id,
            current_stock: 0,
            available_stock: 0,
            reserved_stock: 0,
          },
        });
      }

      await tx.warehouseStock.update({
        where: { id: stock.id },
        data: {
          current_stock: { increment: quantity },
          available_stock: { increment: quantity },
        },
      });

      const updatedMo = await tx.manufacturingOrder.update({
        where: { id: mo.id },
        data: { produced_quantity: { increment: quantity } },
      });

      const mov = await tx.stockMovement.create({
        data: {
          company_id,
          warehouse_id: mo.warehouse_id,
          product_id: mo.product_id,
          transaction_type: 'MANUFACTURING',
          transaction_id: mo.id,
          movement_type: 'MANUFACTURING_PRODUCTION',
          qty_in: quantity,
          qty_out: 0,
          balance_after: stock.current_stock + quantity,
          unit_cost: unit_cost,
          total_cost: allocatedCost,
          created_by: user_id,
          reference_number: mo.order_number,
          remarks: Produced from MO ,
        },
      });

      await createFifoLayer(tx as any, {
        companyId: company_id,
        productId: mo.product_id,
        warehouseId: mo.warehouse_id,
        quantity: quantity,
        unitCost: unit_cost,
        stockMovementId: mov.id
      });"""

new_prod = """      const updatedMo = await tx.manufacturingOrder.update({
        where: { id: mo.id },
        data: { produced_quantity: { increment: quantity } },
      });

      await this.inventoryService.receiveStock(tx as any, {
         companyId: company_id,
         warehouseId: mo.warehouse_id,
         productId: mo.product_id,
         quantity: quantity,
         unitCost: unit_cost,
         referenceType: 'MANUFACTURING_PRODUCTION',
         referenceId: mo.id,
         description: Produced from MO ,
         userId: user_id
      });"""

c = c.replace(old_prod, new_prod)

with open('src/manufacturing/mo/mo.service.ts', 'w') as f:
    f.write(c)

