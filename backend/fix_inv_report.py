with open('src/reports/services/inventory-report.service.ts', 'r') as f:
    c = f.read()

c = c.replace('remaining_qty', 'remaining_quantity')
c = c.replace('item_code', 'code')
c = c.replace('qty_on_hand', 'current_stock')
c = c.replace('qty_allocated', 'reserved_stock')
c = c.replace('qty_available', 'available_stock')

with open('src/reports/services/inventory-report.service.ts', 'w') as f:
    f.write(c)
