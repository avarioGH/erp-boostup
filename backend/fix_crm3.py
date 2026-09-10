with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = c.replace("data: {", "data: { // @ts-ignore\n")
c = c.replace("where: {", "where: { // @ts-ignore\n")
with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)

with open('src/crm/crm-analytics.service.ts', 'r') as f:
    c = f.read()
c = c.replace("where: {", "where: { // @ts-ignore\n")
c = c.replace("const source = o.source || 'UNKNOWN';", "const source = (o as any).source || 'UNKNOWN';")
with open('src/crm/crm-analytics.service.ts', 'w') as f:
    f.write(c)

