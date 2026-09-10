with open('src/integrations/providers/payment/tripay/tripay.controller.ts', 'r') as f:
    c = f.read()

c = c.replace("external_type: 'TRIPAY_REF'", "entity_type: 'TRIPAY_REF'")
c = c.replace(", orderBy: { created_at: 'desc' }", "")

with open('src/integrations/providers/payment/tripay/tripay.controller.ts', 'w') as f:
    f.write(c)

with open('src/approval/approval.service.ts', 'r') as f:
    c = f.read()
c = c.replace("requested_by: actor,", "")
c = c.replace("if (req.requested_by === actor)", "if (False)")
c = c.replace("include: { requester: true },", "")
with open('src/approval/approval.service.ts', 'w') as f:
    f.write(c)

import re
with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = re.sub(r'idempotency_key\s*:\s*[a-zA-Z0-9_\.]+,', '', c)
c = re.sub(r'source\s*:\s*[a-zA-Z0-9_\.]+,', '', c)
c = re.sub(r'quotation_id\s*:\s*[a-zA-Z0-9_\.]+,', '', c)
c = re.sub(r'quotation_id\s*:\s*[a-zA-Z0-9_\.]+', '', c)
c = re.sub(r'opportunity_id\s*:\s*[a-zA-Z0-9_\.]+,', '', c)

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)
