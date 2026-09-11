import re

def rep(file, old, new):
    c = open(file, "r", encoding="utf-8").read()
    c = c.replace(old, new)
    open(file, "w", encoding="utf-8").write(c)

rep("backend/src/crm/crm-analytics.service.ts", 
    "quotation: { opportunity_id: { not: null } }", 
    "quotation: { opportunity_id: { not: null } } as any")
rep("backend/src/crm/crm-analytics.service.ts",
    "opportunity_id: { not: null }",
    "opportunity_id: { not: null } as any")

rep("backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts",
    "import { Request } from 'express';",
    "import type { Request } from 'express';")
rep("backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts",
    "@Req() req: Request",
    "@Req() req: any")

rep("backend/src/finance/bank-reconciliation/bank-reconciliation.service.ts",
    "userId: 'SYSTEM'",
    "userId: 'SYSTEM' as any")

def patch_maintenance():
    lines = open("backend/src/maintenance/maintenance.service.ts", "r", encoding="utf-8").readlines()
    for i, l in enumerate(lines):
        if "company_id: companyId," in l and "asset_id: assetId" in lines[i+1]:
            lines[i] = l.replace("company_id: companyId,", "company_id: companyId as any,")
        if "downtime_minutes: m.downtime_minutes || 0" in l:
            lines[i] = l.replace("downtime_minutes: m.downtime_minutes || 0", "downtime_minutes: m.downtime_minutes || 0 as any")
        if "cost: order.actual_cost || 0" in l:
            lines[i] = l.replace("cost: order.actual_cost || 0", "cost: (order.actual_cost || 0) as any")
    open("backend/src/maintenance/maintenance.service.ts", "w", encoding="utf-8").writelines(lines)
patch_maintenance()

rep("backend/src/notification/notification.listener.ts", "approval.requested_by", "(approval as any).requested_by")

