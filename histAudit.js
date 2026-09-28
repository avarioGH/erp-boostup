const { PrismaClient } = require('@prisma/client');
const prod = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup' } } });

async function run() {
  const result = {
    rawLogs: await prod.rawLog.findMany({ select: { id: true, logNumber: true, batch: true, createdAt: true } }),
    trimmedLogs: await prod.trimmedLog.findMany({ select: { id: true, createdAt: true } }),
    inputLogs: await prod.inputLog.findMany({ select: { id: true, createdAt: true } }),
    outputs: await prod.sawnTimberOutput.findMany({ select: { id: true, createdAt: true } }),
  };
  
  console.log(JSON.stringify(result, null, 2));
  
  // also get before/after counts
  const R = {
    counts: {
        TimberStock: await prod.timberStock.count(),
        TimberStockMovement: await prod.timberStockMovement.count(),
        TimberStockReservation: await prod.timberStockReservation.count(),
        RawLog: await prod.rawLog.count(),
        TrimmedLog: await prod.trimmedLog.count(),
        InputLog: await prod.inputLog.count(),
        SawnTimberOutput: await prod.sawnTimberOutput.count(),
        TimberPurchase: await prod.timberPurchase.count(),
        TimberShipment: await prod.timberShipment.count(),
        TimberSalesOrder: await prod.timberSalesOrder.count(),
        StockAdjustment: await prod.stockAdjustment.count(),
        StockTransfer: await prod.stockTransfer.count(),
        ProductionProcess: await prod.productionProcess.count(),
        StockOpname: await prod.timberStockOpname.count()
    }
  };
  console.log("COUNTS:");
  console.log(JSON.stringify(R.counts, null, 2));

  await prod.$disconnect();
}
run();
