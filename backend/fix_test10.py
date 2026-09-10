with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace("mongod.getUri()", "mongod.getUri() + 'test'")
c = c.replace("  await app.close();", "  if (typeof app !== 'undefined') await app.close();")

with open('test/step20e.ts', 'w') as f:
    f.write(c)

