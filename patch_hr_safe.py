with open("backend/src/hr/hr.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "  async calculatePayroll(companyId: string, employeeId: string, period: string) {\n    return this.prisma.$transaction(async (tx) => {",
    "  async calculatePayroll(companyId: string, employeeId: string, period: string, txClient?: any) {\n    const run = async (tx: any) => {"
)
c = c.replace(
    "      return tx.payroll.findUnique({ where: { id: payroll.id }, include: { items: true } });\n    });\n  }",
    "      return tx.payroll.findUnique({ where: { id: payroll.id }, include: { items: true } });\n    };\n    return txClient ? run(txClient) : this.prisma.$transaction(run);\n  }"
)
c = c.replace(
    "  async postPayroll(companyId: string, id: string) {\n    return this.prisma.$transaction(async (tx) => {",
    "  async postPayroll(companyId: string, id: string, txClient?: any) {\n    const run = async (tx: any) => {"
)
c = c.replace(
    "      await this.eventEmitter.emitAsync('payroll.posted', new PayrollPostedEvent(companyId, p.id, 'EVT-' + Date.now(), new Date(), { netSalary: p.net_salary, period: p.period }, tx as any));\n      return updated;\n    });\n  }",
    "      await this.eventEmitter.emitAsync('payroll.posted', new PayrollPostedEvent(companyId, p.id, 'EVT-' + Date.now(), new Date(), { netSalary: p.net_salary, period: p.period }, tx as any));\n      return updated;\n    };\n    return txClient ? run(txClient) : this.prisma.$transaction(run);\n  }"
)
c = c.replace(
    "  async payPayroll(companyId: string, id: string) {\n    return this.prisma.$transaction(async (tx) => {",
    "  async payPayroll(companyId: string, id: string, txClient?: any) {\n    const run = async (tx: any) => {"
)
c = c.replace(
    "      await this.eventEmitter.emitAsync('payroll.payment', new PayrollPaymentEvent(companyId, p.id, 'EVT-' + Date.now(), new Date(), { amount: p.net_salary }, tx as any));\n      return updated;\n    \n    });\n  }",
    "      await this.eventEmitter.emitAsync('payroll.payment', new PayrollPaymentEvent(companyId, p.id, 'EVT-' + Date.now(), new Date(), { amount: p.net_salary }, tx as any));\n      return updated;\n    };\n    return txClient ? run(txClient) : this.prisma.$transaction(run);\n  }"
)

with open("backend/src/hr/hr.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

