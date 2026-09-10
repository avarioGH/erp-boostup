with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace("can_sell: true, can_purchase: true, ", "")

with open('test/step20e.ts', 'w') as f:
    f.write(c)

