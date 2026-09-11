with open("backend/src/finance/expense/expense.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("include: { employee: true } as any //", "include: { employee: true }")

with open("backend/src/finance/expense/expense.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

