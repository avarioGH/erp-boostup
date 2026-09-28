const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const res = await prisma.company.findFirst();
    console.log("DB_SUCCESS:", res);
  } catch(e) {
    console.error("DB_FAILED:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
