const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const count = await prisma.timberVariant.count();
    console.log("DB SUCCESS! Count:", count);
  } catch (e) {
    console.log("DB ERROR:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
