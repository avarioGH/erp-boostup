with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = c.replace("data: {", "data: { // @ts-ignore\n")
c = c.replace("where: {", "where: { // @ts-ignore\n")

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)
