const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mongodb://avario-user:AvarioMongoDB2023!@localhost:27017/uat_erp?authSource=admin&replicaSet=rs0' } } });
async function run() {
  const users = await prisma.user.findMany({
    where: { username: 'uat_admin' },
    include: { role: { include: { permissions: true } } }
  });
  console.log(users.map(u => ({ username: u.username, companyId: u.company_id, role: u.role?.name, perms: u.role?.permissions?.map(p => p.permission) })));
  await prisma.$disconnect();
}
run();
