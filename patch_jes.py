with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("reference_id: movs[0].id", "reference_id: soId")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
