with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = c.replace("// source: data.source,", "source: data.source || 'MANUAL',")
c = c.replace("quotation_id: opp.quotation_id", "title: opp.title")

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)
