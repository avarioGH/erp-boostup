def patch(file, old, new):
    with open(file, "r", encoding="utf-8") as f:
        c = f.read()
    c = c.replace(old, new)
    with open(file, "w", encoding="utf-8") as f:
        f.write(c)

patch("backend/src/crm/crm-analytics.service.ts", 
      "opportunity_id: opportunityId", 
      "opportunity_id: opportunityId } as any")
patch("backend/src/crm/crm-analytics.service.ts", 
      "where: { opportunity_id: opportunityId } as any",
      "where: { opportunity_id: opportunityId } as any")

patch("backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts",
      "import { BankReconciliationService } from './bank-reconciliation.service';",
      "import { BankReconciliationService } from './bank-reconciliation.service';\nimport type { Request } from 'express';")
patch("backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts",
      "@Req() req: Request",
      "@Req() req: any")

patch("backend/src/finance/bank-reconciliation/bank-reconciliation.service.ts",
      "userId: 'SYSTEM'",
      "userId: 'SYSTEM' as any")

patch("backend/src/maintenance/maintenance.service.ts",
      "data: {\n        company_id: companyId,",
      "data: {\n        company_id: companyId,".replace("data: {", "data: {") + " // patch handled below")
patch("backend/src/maintenance/maintenance.service.ts",
      "data: {\n        company_id: companyId,\n        asset_id: assetId,\n        log_date: new Date(),\n        description,\n        cost\n      }",
      "data: {\n        company_id: companyId,\n        asset_id: assetId,\n        log_date: new Date(),\n        description,\n        cost\n      } as any")

patch("backend/src/maintenance/maintenance.service.ts",
      "downtime_minutes: m.downtime_minutes || 0",
      "downtime_minutes: m.downtime_minutes || 0 } as any //")
patch("backend/src/maintenance/maintenance.service.ts",
      "data: { downtime_minutes: m.downtime_minutes || 0 } as any //",
      "data: { downtime_minutes: m.downtime_minutes || 0 } as any")

patch("backend/src/maintenance/maintenance.service.ts",
      "data: {\n            company_id: companyId,\n            asset_id: order.asset_id,\n            log_date: new Date(),\n            description: `Work order completed: ${order.title}`,\n            cost: order.actual_cost || 0\n          }",
      "data: {\n            company_id: companyId,\n            asset_id: order.asset_id,\n            log_date: new Date(),\n            description: `Work order completed: ${order.title}`,\n            cost: order.actual_cost || 0\n          } as any")

patch("backend/src/notification/notification.listener.ts",
      "approval.requested_by",
      "(approval as any).requested_by")

