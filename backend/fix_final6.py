with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = c.replace("// source: data.source || 'MANUAL',", "source: data.source || 'MANUAL',")

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)
