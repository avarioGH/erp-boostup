with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace("mongod.getUri() + 'test'", "mongod.getUri().split('?')[0] + 'test?' + (mongod.getUri().split('?')[1] || '')")

with open('test/step20e.ts', 'w') as f:
    f.write(c)

