with open('src/integrations/providers/payment/tripay/tripay.controller.ts', 'r') as f:
    c = f.read()

c = c.replace("external_type: 'TRIPAY_TRANSACTION'", "entity_type: 'TRIPAY_TRANSACTION'")
c = c.replace(", orderBy: { created_at: 'desc' }", "")

with open('src/integrations/providers/payment/tripay/tripay.controller.ts', 'w') as f:
    f.write(c)
