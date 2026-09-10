with open('backend/prisma/schema.prisma', 'r') as f:
    c = f.read()

c = c.replace("model Warehouse {", "model Warehouse {\n  manufacturing_orders ManufacturingOrder[]\n  material_reservations MaterialReservation[]")

with open('backend/prisma/schema.prisma', 'w') as f:
    f.write(c)

