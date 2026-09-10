import re
with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = re.sub(r'(?m)^(\s*)idempotency_key:', r'\1// idempotency_key:', c)
c = re.sub(r'(?m)^(\s*)source:', r'\1// source:', c)
c = re.sub(r'(?m)^(\s*)quotation_id:', r'\1// quotation_id:', c)
c = re.sub(r'(?m)^(\s*)opportunity_id:', r'\1// opportunity_id:', c)
c = re.sub(r'OR: \[\{ quotation_id: null \}, \{ quotation_id: \{ isSet: false \} \}\]', 'title: { not: "" }', c)
c = c.replace("quotation_id: quotation.id", "")

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)

