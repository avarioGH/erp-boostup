with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "amount: 50000000, method: 'BANK_TRANSFER'",
    "amount: 50000000, method: 'BANK_TRANSFER', accountId: cashAccountEntity.id"
)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
