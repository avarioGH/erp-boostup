import re

with open('src/inventory/inventory.service.ts', 'r') as f:
    c = f.read()

# Fix createFifoLayer
c = re.sub(r"await createFifoLayer\(tx as any, params\.companyId, params\.warehouseId, params\.productId, params\.quantity, params\.unitCost, params\.referenceType, params\.referenceId, mov\.id\);", 
           "await createFifoLayer(tx as any, { companyId: params.companyId, warehouseId: params.warehouseId, productId: params.productId, quantity: params.quantity, unitCost: params.unitCost, stockMovementId: mov.id });", c)

# Fix consumeFifoLayers
c = re.sub(r"let consumedCost = 0;\n\s+try \{\n\s+consumedCost = await consumeFifoLayers\(tx as any, params\.companyId, params\.warehouseId, params\.productId, params\.quantity, params\.referenceType, params\.referenceId, mov\.id\);\n\s+\} catch", 
           "let consumedCost = 0;\n    try {\n      const fifoRes = await consumeFifoLayers(tx as any, { companyId: params.companyId, warehouseId: params.warehouseId, productId: params.productId, quantity: params.quantity, stockMovementId: mov.id });\n      consumedCost = fifoRes.totalCogs;\n    } catch", c)

# Fix transferFifoLayers
c = re.sub(r"await transferFifoLayers\(tx as any, params\.companyId, params\.productId, params\.sourceWarehouseId, params\.targetWarehouseId, params\.quantity, params\.referenceType, params\.referenceId, movOut\.id, movIn\.id\);", 
           "await transferFifoLayers(tx as any, { companyId: params.companyId, productId: params.productId, sourceWarehouseId: params.sourceWarehouseId, destWarehouseId: params.targetWarehouseId, quantity: params.quantity, sourceMovementId: movOut.id, destMovementId: movIn.id });", c)

with open('src/inventory/inventory.service.ts', 'w') as f:
    f.write(c)
