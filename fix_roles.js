
const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function fix() {
  try {
    let perm = await prisma.permission.findUnique({ where: { name: '*' } });
    if (!perm) {
      perm = await prisma.permission.create({ data: { name: '*', description: 'Super Admin' } });
    }
    
    const ownerRole = await prisma.role.findFirst({ where: { name: 'Owner' } });
    if (ownerRole) {
      await prisma.rolePermission.upsert({
        where: { role_id_permission_id: { role_id: ownerRole.id, permission_id: perm.id } },
        update: {},
        create: { role_id: ownerRole.id, permission_id: perm.id }
      });
      console.log('Owner role granted * permission successfully.');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
fix();

