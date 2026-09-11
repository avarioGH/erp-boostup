with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("password_hash: 'x', first_name: 'A', last_name: 'B'", "")
c = c.replace('password_hash: "x",\n      first_name: "A",\n      last_name: "B"', "")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)

