with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

import re
# Find all referenceId: 'T1', etc.
c = re.sub(r"referenceId: 'T1'", "referenceId: new ObjectId().toHexString()", c)
c = re.sub(r"referenceId: 'T2'", "referenceId: new ObjectId().toHexString()", c)
c = re.sub(r"referenceId: 'C'\+i", "referenceId: new ObjectId().toHexString()", c)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
