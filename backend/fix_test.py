with open('test/step20e.e2e-spec.ts', 'r') as f:
    c = f.read()

c = c.replace('prisma.(async', 'prisma.\\(async')

with open('test/step20e.e2e-spec.ts', 'w') as f:
    f.write(c)

