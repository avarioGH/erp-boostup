import re

with open('src/manufacturing/mo/mo.service.ts', 'r') as f:
    c = f.read()

old_block = """        await this.inventoryService.issueStock(tx as any, {
           companyId: company_id,
           warehouseId: mo.warehouse_id,
           productId: moItem.product_id,
           quantity: reqItem.quantity,
           referenceType: 'MANUFACTURING_CONSUMPTION',
           referenceId: mo.id,
           description: Consumed for MO ,
           userId: user_id
        });

        // STEP 16.5 - True FIFO Consumption
        const { totalCogs, consumed } = await consumeFifoLayers(tx, {
          companyId: company_id,
          productId: moItem.product_id,
          warehouseId: mo.warehouse_id,
          quantity: reqItem.quantity,
          stockMovementId: mov.id
        });

        const actual_unit_cost = reqItem.quantity > 0 ? totalCogs / reqItem.quantity : 0;
        await tx.stockMovement.update({
          where: { id: mov.id },
          data: { unit_cost: actual_unit_cost, total_cost: totalCogs }
        });

        if (totalCogs > 0) {
          await this.eventEmitter.emitAsync(
            'inventory.valuation',
            new InventoryValuationEvent(
              company_id,
              mov.id, // Stock movement id acts as source entity for tracing
              VAL-,
              new Date(),
              {
                type: 'MANUFACTURING_CONSUMPTION',
                totalValue: totalCogs,
                description: Consumption for MO ,
              },
              tx,
            ),
          );
        }"""

new_block = """        const issueRes = await this.inventoryService.issueStock(tx as any, {
           companyId: company_id,
           warehouseId: mo.warehouse_id,
           productId: moItem.product_id,
           quantity: reqItem.quantity,
           referenceType: 'MANUFACTURING_CONSUMPTION',
           referenceId: mo.id,
           description: Consumed for MO ,
           userId: user_id
        });

        if (issueRes.consumedCost > 0) {
          await this.eventEmitter.emitAsync(
            'inventory.valuation',
            new InventoryValuationEvent(
              company_id,
              issueRes.movement.id, // Stock movement id acts as source entity for tracing
              VAL-,
              new Date(),
              {
                type: 'MANUFACTURING_CONSUMPTION',
                totalValue: issueRes.consumedCost,
                description: Consumption for MO ,
              },
              tx,
            ),
          );
        }"""

c = c.replace(old_block, new_block)

with open('src/manufacturing/mo/mo.service.ts', 'w') as f:
    f.write(c)

