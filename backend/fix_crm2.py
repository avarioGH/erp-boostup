import re
with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = re.sub(r'idempotency_key:[^\n]+,\n', '', c)
c = re.sub(r'source:[^\n]+,\n', '', c)
c = re.sub(r'quotation_id:[^\n]+,\n', '', c)
c = re.sub(r'quotation_id:[^\n]+\n', '\n', c)

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)

