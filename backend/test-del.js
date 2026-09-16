const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const wh = await prisma.warehouse.findFirst({ where: { name: 'Kiln Chamber 03' } });
  if (!wh) return console.log('Not found');
  try {
    await prisma.warehouse.delete({ where: { id: wh.id } });
    console.log('Deleted successfully');
  } catch(e) {
    console.log('Error deleting:', e.message);
  }
}
main().finally(() => prisma.$disconnect());
