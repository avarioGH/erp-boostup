with open('test/final.certification.ts', 'r') as f:
    c = f.read()

c = c.replace("// name:", "name:")

with open('test/final.certification.ts', 'w') as f:
    f.write(c)
