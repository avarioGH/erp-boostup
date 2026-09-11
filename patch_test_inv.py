with open('backend/test/verify.erp.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix Inventory Authorized Request setup
c = c.replace("""const hrViewPermId = new ObjectId().toHexString();
  const hrCreatePermId = new ObjectId().toHexString();
  await prisma.permission.createMany({
     data: [
         { id: hrViewPermId, name: 'hr.view', description: 'HR View' },
         { id: hrCreatePermId, name: 'hr.create', description: 'HR Create' }
     ]
  });
  await prisma.rolePermission.createMany({
      data: [
          { role_id: roleFullId, permission_id: hrViewPermId },
          { role_id: roleFullId, permission_id: hrCreatePermId }
      ]
  });""", """const p1 = new ObjectId().toHexString();
  const p2 = new ObjectId().toHexString();
  const p3 = new ObjectId().toHexString();
  await prisma.permission.createMany({
     data: [
         { id: p1, name: 'hr.view', description: 'HR View' },
         { id: p2, name: 'hr.create', description: 'HR Create' },
         { id: p3, name: '*', description: 'All' }
     ]
  });
  await prisma.rolePermission.createMany({
      data: [
          { role_id: roleFullId, permission_id: p1 },
          { role_id: roleFullId, permission_id: p2 },
          { role_id: roleFullId, permission_id: p3 }
      ]
  });""")

with open('backend/test/verify.erp.ts', 'w', encoding='utf-8') as f:
    f.write(c)
