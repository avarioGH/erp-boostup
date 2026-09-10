with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace(", base_price: 100 ", " ")

with open('test/step20e.ts', 'w') as f:
    f.write(c)

