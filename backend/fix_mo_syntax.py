with open('src/manufacturing/mo/mo.service.ts', 'r') as f:
    c = f.read()

c = c.replace("VAL-MO-CONS-,", "\VAL-MO-CONS-\\,")
c = c.replace("Material Consumed for MO ,", "\Material Consumed for MO \\,")

with open('src/manufacturing/mo/mo.service.ts', 'w') as f:
    f.write(c)

