with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("stock_stock_movement_id", "stock_movement_id")
c = c.replace("const jes = await prisma.journalEntry.findMany({ where: { transaction_id: moId } });", "const jes = await prisma.journalEntry.findMany({ where: { reference_id: moId } });")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
