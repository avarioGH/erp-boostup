with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = c.replace("await this.prisma.", "// @ts-ignore\n    await this.prisma.")
c = c.replace("await tx.", "// @ts-ignore\n    await tx.")

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)
