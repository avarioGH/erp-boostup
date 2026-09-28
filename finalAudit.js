const { PrismaClient } = require('@prisma/client');
const uat = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/uat_erp?retryWrites=true&w=majority&appName=erp-boostup' } } });
const prod = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup' } } });

async function run() {
  const UAT_COMPANY = '6ab79d610c6db3e45bbdf53b';
  
  const report = {};

  // 1. Database Identity
  report.dbIdentity = {
    uatDb: await uat.$runCommandRaw({ ping: 1 }),
    uatCompany: await uat.company.findUnique({ where: { id: UAT_COMPANY } }),
    prodInUat: await uat.company.findUnique({ where: { id: '6ab6a3c170de3c0b5cb580cf' } })
  };

  // 4. Master Data Snapshot
  report.masterData = {
    company: await uat.company.count(),
    warehouse: await uat.warehouse.count(),
    location: await uat.location.count(),
    species: await uat.timberSpecies.count(),
    grade: await uat.timberGrade.count(),
    source: await uat.timberSource.count(),
    vehicle: await uat.vehicle.count(),
    driver: await uat.driver.count(),
    unit: await uat.unit.count(),
    product: await uat.product.count(),
    variant: await uat.timberVariant.count()
  };

  // 5. Transaction Snapshot
  report.transactions = {
    purchase: await uat.timberPurchase.count(),
    purchaseLogItem: await uat.timberPurchaseLogItem.count(),
    rawLog: await uat.rawLog.count(),
    trimmedLog: await uat.trimmedLog.count(),
    inputLog: await uat.inputLog.count(),
    sawnOutput: await uat.sawnTimberOutput.count(),
    sawnOutputItem: await uat.sawnTimberOutputItem.count(),
    stock: await uat.timberStock.count(),
    movement: await uat.timberStockMovement.count(),
    salesOrder: await uat.timberSalesOrder.count(),
    salesItem: await uat.timberSalesOrderItem.count(),
    reservation: await uat.timberStockReservation.count(),
    shipment: await uat.timberShipment.count(),
    shipmentItem: await uat.timberShipmentItem.count(),
    adjustment: await uat.stockAdjustment.count(),
    adjustmentItem: await uat.stockAdjustmentItem.count(),
    transfer: await uat.stockTransfer.count(),
    transferItem: await uat.stockTransferItem.count(),
    production: await uat.productionProcess.count(),
    productionIn: await uat.productionProcessInput.count(),
    productionOut: await uat.productionProcessOutput.count(),
    opname: await uat.timberStockOpname.count(),
    opnameItem: await uat.timberStockOpnameItem.count()
  };

  // 6 & 7. Stock Reconciliations & Negative Stock
  const stocks = await uat.timberStock.findMany({ include: { location: true, timberVariant: true } });
  const movements = await uat.timberStockMovement.findMany();
  let matched = 0, mismatched = 0;
  for (const s of stocks) {
    const sMovs = movements.filter(m => m.timberStockId === s.id || (m.locationId === s.locationId && m.timberVariantId === s.timberVariantId && m.batch === s.batch));
    let ledgerPcs = 0; let ledgerM3 = 0;
    for (const m of sMovs) {
      if (m.type === 'IN') { ledgerPcs += m.quantityPcs; ledgerM3 += m.volumeM3; }
      else if (m.type === 'OUT') { ledgerPcs -= m.quantityPcs; ledgerM3 -= m.volumeM3; }
    }
    const isMatch = s.currentPcs === ledgerPcs && Math.abs(s.currentVolumeM3 - ledgerM3) < 0.001;
    if (isMatch) matched++; else mismatched++;
  }
  report.stockRecon = { total: stocks.length, matched, mismatched };
  report.negativeStock = { count: stocks.filter(s => s.currentPcs < 0).length, minPcs: stocks.length > 0 ? Math.min(...stocks.map(s => s.currentPcs)) : 0 };

  // 20. Production Safety
  report.prodSafety = {
    purchase: await prod.timberPurchase.count(),
    purchaseLogItem: await prod.timberPurchaseLogItem.count(),
    rawLog: await prod.rawLog.count(),
    trimmedLog: await prod.trimmedLog.count(),
    inputLog: await prod.inputLog.count(),
    sawnOutput: await prod.sawnTimberOutput.count(),
    sawnOutputItem: await prod.sawnTimberOutputItem.count(),
    stock: await prod.timberStock.count(),
    movement: await prod.timberStockMovement.count(),
    salesOrder: await prod.timberSalesOrder.count(),
    salesItem: await prod.timberSalesOrderItem.count(),
    reservation: await prod.timberStockReservation.count(),
    shipment: await prod.timberShipment.count(),
    shipmentItem: await prod.timberShipmentItem.count(),
    adjustment: await prod.stockAdjustment.count(),
    adjustmentItem: await prod.stockAdjustmentItem.count(),
    transfer: await prod.stockTransfer.count(),
    transferItem: await prod.stockTransferItem.count(),
    production: await prod.productionProcess.count(),
    productionIn: await prod.productionProcessInput.count(),
    productionOut: await prod.productionProcessOutput.count(),
    opname: await prod.timberStockOpname.count(),
    opnameItem: await prod.timberStockOpnameItem.count()
  };

  console.log(JSON.stringify(report, null, 2));
  await uat.$disconnect();
  await prod.$disconnect();
}
run();
