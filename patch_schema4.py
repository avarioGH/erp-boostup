with open('backend/prisma/schema.prisma', 'r') as f:
    c = f.read()

c = c.replace("model Product {", "model Product {\n  boms Bom[]\n  bom_items BomItem[]\n  manufacturing_orders ManufacturingOrder[]\n  manufacturing_order_items ManufacturingOrderItem[]\n  quality_control_points QualityControlPoint[]\n  material_reservations MaterialReservation[]")
c = c.replace("product_id      String      @db.ObjectId\n  product         Product     @relation(fields: [product_id], references: [id])", "product_id      String      @db.ObjectId")

with open('backend/prisma/schema.prisma', 'w') as f:
    f.write(c)
