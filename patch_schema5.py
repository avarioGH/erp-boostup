import re

with open('backend/prisma/schema.prisma', 'r') as f:
    c = f.read()

# Make sure all relations to Product are there
for model in ['Bom', 'BomItem', 'ManufacturingOrder', 'ManufacturingOrderItem', 'QualityControlPoint', 'MaterialReservation']:
    c = re.sub(r'model ' + model + r' \{[\s\S]*?product_id\s+String\s+@db\.ObjectId\n', 
               lambda m: m.group(0) + '  product Product @relation(fields: [product_id], references: [id])\n', c)

with open('backend/prisma/schema.prisma', 'w') as f:
    f.write(c)
