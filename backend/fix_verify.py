with open('test/verify.erp.ts', 'r') as f:
    c = f.read()

c = c.replace("await prisma.(async tx => {", "await prisma.$transaction(async tx => {")

with open('test/verify.erp.ts', 'w') as f:
    f.write(c)
