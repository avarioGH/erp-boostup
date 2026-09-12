const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.rawLog.findMany({ take: 2 });
  console.log(logs.map(l => l.id));
}
main().catch(console.error).finally(() => prisma.$disconnect());
