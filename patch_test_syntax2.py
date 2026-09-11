import re

with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = re.sub(r'const invAcc = await prisma\.chartOfAccount\.findFirst.*?;\n', "const invAcc = { id: new ObjectId().toHexString() };\n", c)
c = re.sub(r'const apAcc = await prisma\.chartOfAccount\.findFirst.*?;\n', "const apAcc = { id: new ObjectId().toHexString() };\n", c)
c = re.sub(r'const expAcc = await prisma\.chartOfAccount\.findFirst.*?;\n', "const expAcc = { id: new ObjectId().toHexString() };\n", c)
c = re.sub(r'const cashAcc = await prisma\.chartOfAccount\.findFirst.*?;\n', "const cashAcc = { id: new ObjectId().toHexString() };\n", c)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
