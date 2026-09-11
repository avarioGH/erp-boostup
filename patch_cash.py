import re

with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = re.sub(r"account_type:\s*'Cash'", "account_type: 'Cash', code: 'CASH-01'", c)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
