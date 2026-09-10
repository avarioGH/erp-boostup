with open('src/inventory/inventory.module.ts', 'r') as f:
    c = f.read()
if "exports" not in c:
    c = c.replace("providers: [InventoryService]", "providers: [InventoryService],\n  exports: [InventoryService]")
with open('src/inventory/inventory.module.ts', 'w') as f:
    f.write(c)
