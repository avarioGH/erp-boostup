with open('src/purchasing/purchasing.service.ts', 'r') as f:
    c = f.read()

c = c.replace('description: PO Receipt ,', 'description: \"PO Receipt \" + po.po_number,')

with open('src/purchasing/purchasing.service.ts', 'w') as f:
    f.write(c)
