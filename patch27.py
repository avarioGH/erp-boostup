with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "const jes = await prisma.journalEntry.findMany({ where: { reference_id: moId } });",
    "const jes = await prisma.journalEntry.findMany({ where: { reference_type: { in: ['MANUFACTURING_CONSUMPTION', 'MANUFACTURING_PRODUCTION'] } } });"
)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
