with open('backend/prisma/schema.prisma', 'r') as f:
    c = f.read()

c = c.replace("items           ManufacturingOrderItem[]", "items           ManufacturingOrderItem[]\n  material_reservations MaterialReservation[]")

with open('backend/prisma/schema.prisma', 'w') as f:
    f.write(c)
