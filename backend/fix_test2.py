with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace("name: 'Cat', status: true", "name: 'Cat'")
c = c.replace("item_code: 'PRODA'", "code: 'PRODA'")
c = c.replace("destinationWarehouseId: warehouseB", "targetWarehouseId: warehouseB")

with open('test/step20e.ts', 'w') as f:
    f.write(c)

