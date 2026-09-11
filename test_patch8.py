with open('backend/test/verify.erp.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("name: 'Asset' }", "name: 'Asset', normal_balance: 'DEBIT' }")
c = c.replace("name: 'Revenue' }", "name: 'Revenue', normal_balance: 'CREDIT' }")
c = c.replace("name: 'Asset B' }", "name: 'Asset B', normal_balance: 'DEBIT' }")

c = c.replace("name: 'Cash', account_type_id", "account_name: 'Cash', account_type_id")
c = c.replace("name: 'Sales', account_type_id", "account_name: 'Sales', account_type_id")
c = c.replace("name: 'Cash B', account_type_id", "account_name: 'Cash B', account_type_id")
c = c.replace("name: 'X', account_type_id", "account_name: 'X', account_type_id")

c = c.replace("const promises = [];", "const promises: Promise<any>[] = [];")

with open('backend/test/verify.erp.ts', 'w', encoding='utf-8') as f:
    f.write(c)
