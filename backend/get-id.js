const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getFirstId() {
  const p = await prisma.productionProcess.findFirst();
  console.log(p ? p.id : "null");
  await prisma.$disconnect();
}
getFirstId();
