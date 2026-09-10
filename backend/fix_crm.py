import re

with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = re.sub(r'idempotency_key: [^,]+,\s*', '', c)
c = re.sub(r'source: [^,]+,\s*', '', c)
c = re.sub(r'quotation_id: [^,]+,\s*', '', c)

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)

with open('src/crm/crm-analytics.service.ts', 'r') as f:
    c = f.read()

c = re.sub(r'idempotency_key: [^,]+,\s*', '', c)
c = re.sub(r'source: [^,]+,\s*', '', c)
c = re.sub(r'quotation_id: [^,]+,\s*', '', c)
c = re.sub(r'opportunity_id: [^,]+,\s*', '', c)

with open('src/crm/crm-analytics.service.ts', 'w') as f:
    f.write(c)

