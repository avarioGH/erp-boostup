with open("backend/src/ecommerce/ecommerce-checkout.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

import re

imports = "import { EventEmitter2 } from '@nestjs/event-emitter';\nimport { InventoryValuationEvent } from '../events/accounting.events';\n"
if "InventoryValuationEvent" not in c:
    c = imports + c
    c = c.replace("private inventoryService: InventoryService", "private inventoryService: InventoryService,\n    private eventEmitter: EventEmitter2")

# Inject the emit right after the loop inside the transaction
emit_code = """
          let totalCogs = 0;
          for (const item of cart.items) {
             const cons = await tx.costLayerConsumption.findMany({
                where: {
                  stockMovement: {
                    transaction_type: 'ECOMMERCE',
                    transaction_id: salesOrder.id,
                    product_id: item.product_id
                  }
                }
             });
             totalCogs += cons.reduce((sum, c) => sum + (c.quantity_consumed * c.unit_cost), 0);
          }
          if (totalCogs > 0) {
            await this.eventEmitter.emitAsync('inventory.valuation', new InventoryValuationEvent(
              companyId,
              salesOrder.id,
              'EVT-' + Date.now(),
              new Date(),
              { type: 'COGS', totalValue: totalCogs },
              tx as any
            ));
          }
"""
c = c.replace("if (fail_at === 'RESERVATION') throw new Error('Test Failure: RESERVATION');",
              emit_code + "\n\n          if (fail_at === 'RESERVATION') throw new Error('Test Failure: RESERVATION');")

with open("backend/src/ecommerce/ecommerce-checkout.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
