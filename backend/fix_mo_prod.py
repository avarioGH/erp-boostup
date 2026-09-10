import re

with open('src/manufacturing/mo/mo.service.ts', 'r') as f:
    c = f.read()

old_logic = """      let stock = await tx.warehouseStock.findUnique({
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
          remarks: Produced from MO \,
        },
      });"""

new_logic = """      const updatedMo = await tx.manufacturingOrder.update({
        where: { id: mo.id },
        data: { produced_quantity: { increment: quantity } },
      });

      const receiveRes = await this.inventoryService.receiveStock(tx as any, {
         companyId: company_id,
         warehouseId: mo.warehouse_id,
         productId: mo.product_id,
         quantity: quantity,
         unitCost: unit_cost,
         referenceType: 'MANUFACTURING_PRODUCTION',
         referenceId: mo.id,
         description: Produced from MO \,
         userId: user_id
      });
      const mov = receiveRes.movement;
"""

c = c.replace(old_logic, new_logic)

with open('src/manufacturing/mo/mo.service.ts', 'w') as f:
    f.write(c)

