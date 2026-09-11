with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("addToCart(c1, sessionId, pEco, 2)", "addItem(c1, sessionId, pEco, 2)")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
