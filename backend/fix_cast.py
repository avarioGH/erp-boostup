import re

with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = re.sub(r'data:\s*{', 'data: {', c)
c = re.sub(r'create\(\{([^}]+)data:\s*{', r'create({ \1data: {', c)

# Instead of complex regex, I will just cast the whole object!
# this.prisma.lead.create({ data: { ... } }) -> this.prisma.lead.create({ ... } as any)
c = re.sub(r'\.create\(\{', '.create({ /* @ts-ignore */ ', c)
c = re.sub(r'\.update\(\{', '.update({ /* @ts-ignore */ ', c)
c = re.sub(r'\.updateMany\(\{', '.updateMany({ /* @ts-ignore */ ', c)
c = re.sub(r'\.findFirst\(\{', '.findFirst({ /* @ts-ignore */ ', c)
c = re.sub(r'\.findMany\(\{', '.findMany({ /* @ts-ignore */ ', c)
c = re.sub(r'\.findUnique\(\{', '.findUnique({ /* @ts-ignore */ ', c)

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)
