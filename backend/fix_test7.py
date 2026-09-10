with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace("code: 'PCS', name: 'PCS'", "name: 'PCS'")

with open('test/step20e.ts', 'w') as f:
    f.write(c)

