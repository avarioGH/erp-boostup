with open('backend/src/auth/permissions.guard.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("userPermissions.includes(permission)", "(userPermissions.includes(permission) || userPermissions.includes('*'))")

with open('backend/src/auth/permissions.guard.ts', 'w', encoding='utf-8') as f:
    f.write(c)
