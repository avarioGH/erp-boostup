with open('src/crm/delivery/delivery.module.ts', 'r') as f:
    c = f.read()
if "InventoryModule" not in c:
    c = c.replace("providers: [DeliveryService]", "imports: [require('../../inventory/inventory.module').InventoryModule],\n  providers: [DeliveryService]")
with open('src/crm/delivery/delivery.module.ts', 'w') as f:
    f.write(c)
