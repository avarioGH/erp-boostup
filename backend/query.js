const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sales = await prisma.salesOrder.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: { items: true }
  });
  console.log('Recent Sales Orders:', JSON.stringify(sales, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
