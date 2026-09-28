const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'mongodb://avario-user:AvarioMongoDB2023!@localhost:27017/uat_erp?authSource=admin&replicaSet=rs0' } } });
async function run() {
  const user = await prisma.user.findFirst({
    where: { email: 'uat_admin_49h@boostup.id' },
    include: { role: true }
  });
  console.log(user ? user.role.name : 'NOT FOUND');
  await prisma.$disconnect();
}
run();
