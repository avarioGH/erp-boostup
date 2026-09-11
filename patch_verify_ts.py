with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Fix redeclare gl
c = c.replace("const gl = app.get('GlService');", "")

# Fix movement_id -> stock_movement_id
c = c.replace("movement_id: movs[0].id", "stock_movement_id: movs[0].id")

# Fix quantity_consumed -> quantity
c = c.replace("cons[0].quantity_consumed", "cons[0].quantity")

# Fix crypto.createHmac by ensuring it is imported or using require
if "import * as crypto" not in c:
    c = "import * as crypto from 'crypto';\n" + c

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
