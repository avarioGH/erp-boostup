with open("backend/src/hr/hr.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

# For calculatePayroll
c = c.replace(
    "async calculatePayroll(companyId: string, employeeId: string, period: string) {",
    "async calculatePayroll(companyId: string, employeeId: string, period: string, txClient?: any) {"
)
c = c.replace(
    """  async calculatePayroll(companyId: string, employeeId: string, period: string, txClient?: any) {
    return this.prisma.$transaction(async (tx) => {""",
    """  async calculatePayroll(companyId: string, employeeId: string, period: string, txClient?: any) {
    const run = async (tx: any) => {"""
)
# We need to replace the `    });\n  }` at the end of calculatePayroll with `    };\n    return txClient ? run(txClient) : this.prisma.$transaction(run);\n  }`
# Since it's hard to match reliably without regex, let's just do it manually by finding the line.
