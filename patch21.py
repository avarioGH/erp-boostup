with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("get('/boms');", "get('/bom');")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
