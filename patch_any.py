files = {
    "backend/src/finance/period/period.service.ts": [
        ("this.prisma.accountingPeriod.create", "(this.prisma.accountingPeriod as any).create"),
        ("this.prisma.accountingPeriod.findMany", "(this.prisma.accountingPeriod as any).findMany"),
        ("this.prisma.accountingPeriod.updateMany", "(this.prisma.accountingPeriod as any).updateMany"),
    ],
    "backend/src/finance/bank-reconciliation/bank-reconciliation.service.ts": [
        ("this.prisma.bankReconciliation.", "(this.prisma as any).bankReconciliation."),
        ("this.prisma.bankReconciliationMatch.", "(this.prisma as any).bankReconciliationMatch."),
        ("this.prisma.bankStatement.", "(this.prisma as any).bankStatement."),
        ("this.prisma.bankStatementLine.", "(this.prisma as any).bankStatementLine."),
        ("tx.bankReconciliation.", "(tx as any).bankReconciliation."),
        ("tx.bankReconciliationMatch.", "(tx as any).bankReconciliationMatch."),
        ("tx.bankStatement.", "(tx as any).bankStatement."),
        ("tx.bankStatementLine.", "(tx as any).bankStatementLine.")
    ],
    "backend/src/integrations/integrations.service.ts": [
        ("this.prisma.integration.", "(this.prisma.integration as any).")
    ],
    "backend/src/integrations/integration-credential.service.ts": [
        ("this.prisma.integrationCredential.", "(this.prisma as any).integrationCredential.")
    ],
    "backend/src/notification/notification.listener.ts": [
        ("req.requested_by", "(req as any).requested_by")
    ]
}

for path, replacements in files.items():
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
