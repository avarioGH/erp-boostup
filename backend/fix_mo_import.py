with open('src/manufacturing/mo/mo.service.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "import { InventoryValuationEvent } from '../../events/accounting.events';",
    "import { InventoryValuationEvent } from '../../events/accounting.events';\nimport { InventoryService } from '../../inventory/inventory.service';"
)

with open('src/manufacturing/mo/mo.service.ts', 'w') as f:
    f.write(c)

