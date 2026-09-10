import os
if os.path.exists('src/manufacturing/manufacturing.module.ts'):
    with open('src/manufacturing/manufacturing.module.ts', 'r') as f:
        c = f.read()
    if "InventoryModule" not in c:
        c = c.replace("providers: [", "imports: [require('../inventory/inventory.module').InventoryModule],\n  providers: [")
    with open('src/manufacturing/manufacturing.module.ts', 'w') as f:
        f.write(c)

if os.path.exists('src/pos/pos.module.ts'):
    with open('src/pos/pos.module.ts', 'r') as f:
        c = f.read()
    if "InventoryModule" not in c:
        c = c.replace("providers: [", "imports: [require('../inventory/inventory.module').InventoryModule],\n  providers: [")
    with open('src/pos/pos.module.ts', 'w') as f:
        f.write(c)

if os.path.exists('src/purchasing/purchasing.module.ts'):
    with open('src/purchasing/purchasing.module.ts', 'r') as f:
        c = f.read()
    if "InventoryModule" not in c:
        c = c.replace("providers: [", "imports: [require('../inventory/inventory.module').InventoryModule],\n  providers: [")
    with open('src/purchasing/purchasing.module.ts', 'w') as f:
        f.write(c)
