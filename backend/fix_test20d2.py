with open('test/step20d2.ts', 'r') as f:
    c = f.read()

c = c.replace("// description:", "/* description: */")

with open('test/step20d2.ts', 'w') as f:
    f.write(c)

