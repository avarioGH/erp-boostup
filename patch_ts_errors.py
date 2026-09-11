import re

with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Fix uAdminId redeclaration
c = re.sub(r"const uAdminId = new ObjectId\(\)\.toHexString\(\);\s*// In case we need one\s*await prisma\.user\.create\(\{.*?\}\);", "", c, flags=re.DOTALL)

# Fix Unit create
c = re.sub(r"code: 'PCS', ", "", c)
# Fix Category create
c = re.sub(r"code: 'C1', ", "", c)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
