const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const stocks = await prisma.timberStock.findMany({ include: { location: true, timberVariant: true } });
  console.log("Total stocks:", stocks.length);
  for (const s of stocks) {
    console.log("Stock in " + s.location?.name + ": " + s.currentPcs + " PCS of variant " + s.timberVariant?.name + " (" + s.timberVariantId + ")");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
