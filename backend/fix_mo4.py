import re

with open('src/manufacturing/mo/mo.service.ts', 'r') as f:
    c = f.read()

c = re.sub(
    r"// STEP 16.5 - True FIFO Consumption.*?await tx\.stockMovement\.update.*?await this\.eventEmitter\.emitAsync.*?\);.*?\}",
    r"""if (issueRes.consumedCost > 0) {
          await this.eventEmitter.emitAsync(
            'inventory.valuation',
            new InventoryValuationEvent(
              company_id,
              issueRes.movement.id, // Stock movement id acts as source entity for tracing
              VAL-MO-CONS-,
              new Date(),
              {
                type: 'MANUFACTURING_CONSUMPTION',
                totalValue: issueRes.consumedCost,
                description: Material Consumed for MO ,
              },
              tx,
            ),
          );
        }""",
    c,
    flags=re.DOTALL
)

with open('src/manufacturing/mo/mo.service.ts', 'w') as f:
    f.write(c)

