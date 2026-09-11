with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

idx = c.find("// M. INVENTORY RBAC & N. TENANT ISOLATION")
if idx != -1: print(c[idx:idx+800])
