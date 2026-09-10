with open('src/integrations/shopee/shopee.service.ts', 'r') as f:
    c = f.read()

c = c.replace("user_created: { connect: { id: user_id } }", "created_by: user_id")
c = c.replace("const movement = await tx.stockMovement.create(", "const movement = await this.prisma.stockMovement.create(")

with open('src/integrations/shopee/shopee.service.ts', 'w') as f:
    f.write(c)
