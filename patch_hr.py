with open("backend/src/hr/hr.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("return this.prisma.payroll.findUnique", "return tx.payroll.findUnique")

with open("backend/src/hr/hr.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

