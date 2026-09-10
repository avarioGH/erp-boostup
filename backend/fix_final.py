with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = c.replace("idempotency_key: data.idempotency_key", "")
c = c.replace("source: data.source", "")
c = c.replace("idempotency_key: dto.idempotency_key", "")
c = c.replace("quotation_id: quotation.id", "")

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)

with open('src/approval/approval.service.ts', 'r') as f:
    c = f.read()
c = c.replace("False", "false")
with open('src/approval/approval.service.ts', 'w') as f:
    f.write(c)

with open('src/integrations/providers/payment/tripay/tripay.controller.ts', 'r') as f:
    c = f.read()
c = c.replace(" orderBy: { created_at: 'desc' }", "")
with open('src/integrations/providers/payment/tripay/tripay.controller.ts', 'w') as f:
    f.write(c)
