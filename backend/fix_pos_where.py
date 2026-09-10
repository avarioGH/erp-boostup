import re
with open('src/pos/pos.service.ts', 'r') as f:
    c = f.read()

c = c.replace("company: {connect:{id:companyId}},", "company_id: companyId,")

with open('src/pos/pos.service.ts', 'w') as f:
    f.write(c)

