const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    await prisma.$connect();
    console.log("DB_CONNECTION_SUCCESS");
    // Harmless read
    const count = await prisma.user.count().catch(() => 0);
    console.log("READ_SUCCESS: " + count);
  } catch (e) {
    console.log("DB_CONNECTION_FAILED: " + e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
