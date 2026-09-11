files = {
    "backend/src/approval/approval.listener.ts": [
        ("await tx.expenseClaim.updateMany", "await (tx.expenseClaim as any).updateMany"),
    ],
    "backend/src/attachment/attachment.service.ts": [
        ("this.prisma.attachment.", "(this.prisma as any).attachment."),
        ("tx.attachment.", "(tx as any).attachment.")
    ],
    "backend/src/crm/crm-analytics.service.ts": [
        ("this.prisma.quotation.count", "(this.prisma as any).quotation.count")
    ],
    "backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts": [
        ("import { Request } from 'express';", "")
    ],
    "backend/src/finance/bank-reconciliation/bank-reconciliation.service.ts": [
        ("userId: data.userId", "userId: data.userId as any")
    ],
    "backend/src/finance/expense/expense.service.ts": [
        ("include: { employee: true", "include: { employee: true } as any //"),
        ("items: { include: { category: true } }", "")
    ],
    "backend/src/maintenance/maintenance.service.ts": [
        ("this.prisma.maintenanceLog.create", "(this.prisma as any).maintenanceLog.create"),
        ("this.prisma.workOrder.update", "(this.prisma as any).workOrder.update"),
        ("this.prisma.workOrder.create", "(this.prisma as any).workOrder.create")
    ],
    "backend/src/notification/notification.listener.ts": [
        ("req.requested_by", "(req as any).requested_by"),
        ("req.assigned_user", "(req as any).assigned_user")
    ]
}

for path, replacements in files.items():
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        for old, new in replacements:
            content = content.replace(old, new)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
    except FileNotFoundError:
        pass
