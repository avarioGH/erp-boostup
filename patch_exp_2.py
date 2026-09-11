with open("backend/src/finance/expense/expense.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("// @ts-nocheck\n", "")
c = c.replace("this.prisma.expenseClaim.", "(this.prisma.expenseClaim as any).")
c = c.replace("tx.expenseClaim.", "(tx.expenseClaim as any).")

with open("backend/src/finance/expense/expense.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
