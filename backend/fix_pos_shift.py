with open('src/pos/pos.service.ts', 'r') as f:
    c = f.read()

c = c.replace(
    "warehouse_id: warehouseId,\n        user_id: userId,",
    "warehouse: {connect:{id:warehouseId}},\n        user: {connect:{id:userId}},"
)

with open('src/pos/pos.service.ts', 'w') as f:
    f.write(c)

