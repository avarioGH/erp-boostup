import re

def patch(file, pattern, replacement):
    with open(file, "r", encoding="utf-8") as f:
        c = f.read()
    if re.search(pattern, c, flags=re.DOTALL):
        c = re.sub(pattern, replacement, c, flags=re.DOTALL)
        with open(file, "w", encoding="utf-8") as f:
            f.write(c)
        print(f"Patched {file}")
    else:
        print(f"Could not find pattern in {file}")

patch("backend/src/crm/crm-analytics.service.ts", 
      r"where: \{\s*opportunity_id: opportunityId\s*\}", 
      r"where: { opportunity_id: opportunityId } as any")

patch("backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts",
      r"import \{ Request \} from 'express';",
      r"import type { Request } from 'express';")

patch("backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts",
      r"@Req\(\) req: Request",
      r"@Req() req: any")

patch("backend/src/finance/bank-reconciliation/bank-reconciliation.service.ts",
      r"userId: 'SYSTEM'",
      r"userId: 'SYSTEM' as any")

patch("backend/src/maintenance/maintenance.service.ts",
      r"data: \{\s*company_id: companyId,\s*asset_id: assetId,\s*log_date: new Date\(\),\s*description,\s*cost\s*\}",
      r"data: {\n        company_id: companyId,\n        asset_id: assetId,\n        log_date: new Date(),\n        description,\n        cost\n      } as any")

patch("backend/src/maintenance/maintenance.service.ts",
      r"data: \{\s*downtime_minutes: m.downtime_minutes \|\| 0\s*\}",
      r"data: { downtime_minutes: m.downtime_minutes || 0 } as any")

patch("backend/src/maintenance/maintenance.service.ts",
      r"data: \{\s*company_id: companyId,\s*asset_id: order.asset_id,\s*log_date: new Date\(\),\s*description: `Work order completed: \$\{order.title\}`,\s*cost: order.actual_cost \|\| 0\s*\}",
      r"data: {\n            company_id: companyId,\n            asset_id: order.asset_id,\n            log_date: new Date(),\n            description: `Work order completed: ${order.title}`,\n            cost: order.actual_cost || 0\n          } as any")

patch("backend/src/notification/notification.listener.ts",
      r"approval\.requested_by",
      r"(approval as any).requested_by")

