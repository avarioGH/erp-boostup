with open('backend/src/system/system-bootstrap.service.ts', 'r') as f:
    c = f.read()

c = c.replace("code: 'SYS',", "")
c = c.replace("password_hash:", "password:")
c = c.replace("role: 'ADMIN',", "username: 'system',")
c = c.replace("await bcrypt.hash('System#123!', 10)", "''")

with open('backend/src/system/system-bootstrap.service.ts', 'w') as f:
    f.write(c)
