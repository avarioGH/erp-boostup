with open('backend/src/pos/pos.service.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("totalPosCogs += issueRes.totalCogs;", "totalPosCogs += issueRes.consumedCost;")

with open('backend/src/pos/pos.service.ts', 'w', encoding='utf-8') as f:
    f.write(c)
