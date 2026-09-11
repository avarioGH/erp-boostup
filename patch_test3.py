with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("movement_type: 'TRANSFER_OUT' }, orderBy: { created_at: 'desc' } });\n    assert(mov !== null, 'D4 StockMovement created');", "movement_type: 'OUT' }, orderBy: { created_at: 'desc' } });\n    assert(mov !== null, 'D4 StockMovement created');")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
