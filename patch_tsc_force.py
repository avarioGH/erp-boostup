with open("backend/src/crm/crm-analytics.service.ts", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace("{ opportunity_id: opportunityId }", "{ opportunity_id: opportunityId } as any")
with open("backend/src/crm/crm-analytics.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

with open("backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace("import { Request } from 'express';", "import type { Request } from 'express';")
c = c.replace("@Req() req: Request", "@Req() req: any")
with open("backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts", "w", encoding="utf-8") as f:
    f.write(c)

with open("backend/src/finance/bank-reconciliation/bank-reconciliation.service.ts", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace("userId: 'SYSTEM'", "userId: 'SYSTEM' as any")
with open("backend/src/finance/bank-reconciliation/bank-reconciliation.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

with open("backend/src/maintenance/maintenance.service.ts", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace("downtime_minutes: m.downtime_minutes || 0", "downtime_minutes: m.downtime_minutes || 0 } as any //")
c = c.replace("cost\n      }", "cost\n      } as any")
c = c.replace("cost: order.actual_cost || 0\n          }", "cost: order.actual_cost || 0\n          } as any")
with open("backend/src/maintenance/maintenance.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

with open("backend/src/notification/notification.listener.ts", "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace("approval.requested_by", "(approval as any).requested_by")
with open("backend/src/notification/notification.listener.ts", "w", encoding="utf-8") as f:
    f.write(c)
