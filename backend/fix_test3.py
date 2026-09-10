with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace("is_stock: true, ", "")

with open('test/step20e.ts', 'w') as f:
    f.write(c)

