with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("const p1Found = res.body.data?.some((p: any) => p.id === prod1);", "const p1Found = !!res.body.data?.some((p: any) => p.id === prod1);")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
