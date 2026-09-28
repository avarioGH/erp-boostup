const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runLegacyUAT() {
  const result = { 
    legacyWarehouseStock: 0,
    legacyStockMovement: 0,
    legacyInventoryTransaction: 0,
  };
  
  try {
    result.legacyWarehouseStock = await prisma.warehouseStock?.count().catch(e => -1);
    result.legacyStockMovement = await prisma.stockMovement?.count().catch(e => -1);
    result.legacyInventoryTransaction = await prisma.inventoryTransaction?.count().catch(e => -1);

    console.log("JSON_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("JSON_END");
  } catch (e) {
    console.error("ERROR", e);
  } finally {
    await prisma.$disconnect();
  }
}
runLegacyUAT();
