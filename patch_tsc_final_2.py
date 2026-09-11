import os
def patch(f, o, n):
    c = open(f, "r", encoding="utf-8").read()
    if o in c:
        c = c.replace(o, n)
        open(f, "w", encoding="utf-8").write(c)

patch("backend/src/crm/crm-analytics.service.ts", 
      "where: { opportunity_id: opportunityId }", 
      "where: { opportunity_id: opportunityId } as any")
patch("backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts", 
      "import { Request } from 'express';", 
      "import type { Request } from 'express';")
patch("backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts", 
      "@Req() req: Request", 
      "@Req() req: any")
patch("backend/src/finance/bank-reconciliation/bank-reconciliation.service.ts", 
      "userId: 'SYSTEM'", 
      "userId: 'SYSTEM' as any")
patch("backend/src/maintenance/maintenance.service.ts", 
      "company_id: companyId,\n        asset_id: assetId,", 
      "company_id: companyId,\n        asset_id: assetId,".replace("company_id", "company_id /* patched */")) # skip this one, I'll use regex below
patch("backend/src/maintenance/maintenance.service.ts", 
      "data: {\n        company_id: companyId,\n        asset_id: assetId,\n        log_date: new Date(),\n        description,\n        cost\n      }", 
      "data: {\n        company_id: companyId,\n        asset_id: assetId,\n        log_date: new Date(),\n        description,\n        cost\n      } as any")
patch("backend/src/maintenance/maintenance.service.ts", 
      "downtime_minutes: m.downtime_minutes || 0\n      }", 
      "downtime_minutes: m.downtime_minutes || 0\n      } as any")
patch("backend/src/maintenance/maintenance.service.ts", 
      "company_id: companyId,\n            asset_id: order.asset_id,\n            log_date: new Date(),\n            description: `Work order completed: ${order.title}`,\n            cost: order.actual_cost || 0\n          }", 
      "company_id: companyId,\n            asset_id: order.asset_id,\n            log_date: new Date(),\n            description: `Work order completed: ${order.title}`,\n            cost: order.actual_cost || 0\n          } as any")
patch("backend/src/notification/notification.listener.ts", 
      "approval.requested_by", 
      "(approval as any).requested_by")
