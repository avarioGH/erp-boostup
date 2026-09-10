with open('test/verify.erp.ts', 'r') as f:
    c = f.read()

c = c.replace("code: 'TC', ", "")

with open('test/verify.erp.ts', 'w') as f:
    f.write(c)
