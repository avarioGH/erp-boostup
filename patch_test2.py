with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("movement_type: 'OUT' }, orderBy", "movement_type: 'TRANSFER_OUT' }, orderBy")
c = c.replace("movement_type: 'IN' }, orderBy", "movement_type: 'TRANSFER_IN' }, orderBy")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
