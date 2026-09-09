const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.company.count();
    console.log('DB_SUCCESS');
  } catch (e) {
    console.log('DB_FAIL', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
