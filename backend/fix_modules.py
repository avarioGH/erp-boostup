with open('src/crm/crm.module.ts', 'r') as f:
    c = f.read()
if "InventoryModule" not in c:
    c = c.replace("providers: [", "imports: [require('../inventory/inventory.module').InventoryModule],\n  providers: [")
with open('src/crm/crm.module.ts', 'w') as f:
    f.write(c)

with open('src/ecommerce/ecommerce.module.ts', 'r') as f:
    c = f.read()
if "InventoryModule" not in c:
    c = c.replace("providers: [", "imports: [require('../inventory/inventory.module').InventoryModule],\n  providers: [")
with open('src/ecommerce/ecommerce.module.ts', 'w') as f:
    f.write(c)

with open('src/manufacturing/mo/mo.module.ts', 'r') as f:
    c = f.read()
if "InventoryModule" not in c:
    c = c.replace("providers: [", "imports: [require('../../inventory/inventory.module').InventoryModule],\n  providers: [")
with open('src/manufacturing/mo/mo.module.ts', 'w') as f:
    f.write(c)
