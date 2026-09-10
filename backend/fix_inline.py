with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = c.replace(", idempotency_key: data.idempotency_key ", " ")
c = c.replace(", idempotency_key: dto.idempotency_key ", " ")
c = c.replace("quotation_id: opp.quotation_id", "title: opp.title")

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)
