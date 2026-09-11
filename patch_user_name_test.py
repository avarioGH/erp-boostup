with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "username: 'appr', email: 'a@b.com', password_hash: 'x', first_name: 'A', last_name: 'B'",
    "username: 'appr', name: 'Appr', email: 'a@b.com', password_hash: 'x', first_name: 'A', last_name: 'B'"
)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
