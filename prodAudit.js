const { PrismaClient } = require('@prisma/client');

const prodUrl = 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup';
const prod = new PrismaClient({ datasources: { db: { url: prodUrl } } });

async function run() {
  const R = {};

  const beforeCounts = {
    movements: await prod.timberStockMovement.count(),
    transactions: await prod.timberSalesOrder.count() + await prod.stockTransfer.count() + await prod.stockAdjustment.count()
  };

  R.dbIdentity = {
    ping: await prod.$runCommandRaw({ ping: 1 }),
    url: prodUrl.includes('erp_db') ? 'erp_db' : 'UNKNOWN'
  };

  const companies = await prod.company.findMany();
  R.companies = companies.map(c => ({ id: c.id, name: c.name, type: c.id === '6ab6a3c170de3c0b5cb580cf' ? 'production' : (c.id === '6ab79d610c6db3e45bbdf53b' ? 'UAT' : 'other') }));

  R.masterData = {
    warehouse: await prod.warehouse.count(),
    location: await prod.location.count(),
    species: await prod.timberSpecies.count(),
    grade: await prod.timberGrade.count(),
    source: await prod.timberSource.count(),
    vehicle: await prod.vehicle.count(),
    driver: await prod.driver.count(),
    unit: await prod.unit.count(),
    product: await prod.product.count(),
    variant: await prod.timberVariant.count(),
    category: await prod.category.count()
  };

  const stocks = await prod.timberStock.findMany({ include: { location: true, timberVariant: true } });
  const movements = await prod.timberStockMovement.findMany();
  const reservations = await prod.timberStockReservation.findMany();
  
  R.inventory = {
    stockRows: stocks.length,
    movements: movements.length,
    reservations: reservations.length,
    totalPcs: stocks.reduce((sum, s) => sum + s.currentPcs, 0),
    totalM3: stocks.reduce((sum, s) => sum + s.currentVolumeM3, 0),
    negativeStock: stocks.filter(s => s.currentPcs < 0).length,
    zeroStock: stocks.filter(s => s.currentPcs === 0).length,
    unknownBatches: stocks.filter(s => s.batch === 'UNKNOWN').length,
  };

  let matched = 0, mismatched = 0, noHistory = 0;
  for(const s of stocks) {
    const sMovs = movements.filter(m => m.timberStockId === s.id || (m.locationId === s.locationId && m.timberVariantId === s.timberVariantId && m.batch === s.batch));
    if (sMovs.length === 0) {
      if (s.currentPcs === 0) { matched++; } else { noHistory++; }
      continue;
    }
    let ledgerPcs = 0, ledgerM3 = 0;
    for(const m of sMovs) {
      if(m.type === 'IN') { ledgerPcs += m.quantityPcs; ledgerM3 += m.volumeM3; }
      else if(m.type === 'OUT') { ledgerPcs -= m.quantityPcs; ledgerM3 -= m.volumeM3; }
    }
    if (s.currentPcs === ledgerPcs && Math.abs(s.currentVolumeM3 - ledgerM3) < 0.001) matched++;
    else mismatched++;
  }
  R.recon = { matched, mismatched, noHistory, total: stocks.length };
  
  R.negativeStocks = stocks.filter(s => s.currentPcs < 0).map(s => ({
    company: s.location?.company_id, warehouse: s.location?.code, variant: s.timberVariant?.sku, batch: s.batch, pcs: s.currentPcs, m3: s.currentVolumeM3
  }));

  R.transactions = {
    purchase: await prod.timberPurchase.count(),
    purchaseLogItem: await prod.timberPurchaseLogItem.count(),
    rawLog: await prod.rawLog.count(),
    trimmedLog: await prod.trimmedLog.count(),
    inputLog: await prod.inputLog.count(),
    sawnOutput: await prod.sawnTimberOutput.count(),
    sawnOutputItem: await prod.sawnTimberOutputItem.count(),
    salesOrder: await prod.timberSalesOrder.count(),
    salesItem: await prod.timberSalesOrderItem.count(),
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

  const adjs = await prod.stockAdjustment.findMany({ select: { status: true } });
  const trfs = await prod.stockTransfer.findMany({ select: { status: true } });
  const so = await prod.timberSalesOrder.findMany({ select: { status: true } });
  const ship = await prod.timberShipment.findMany({ select: { status: true } });
  
  const statusCounts = (items) => items.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {});
  R.transactionStates = {
    adjustments: statusCounts(adjs),
    transfers: statusCounts(trfs),
    salesOrders: statusCounts(so),
    shipments: statusCounts(ship)
  };

  R.reservations = reservations.map(r => {
    // Find matching stock
    const matchingStock = stocks.find(s => s.locationId === r.locationId && s.timberVariantId === r.timberVariantId);
    return {
      warehouse: r.locationId, variant: r.timberVariantId, reserved: r.reservedPcs, physical: matchingStock?.currentPcs || 0,
      valid: r.reservedPcs <= (matchingStock?.currentPcs || 0)
    };
  });

  R.batches = Array.from(new Set(stocks.map(s => s.batch)));

  const afterCounts = {
    movements: await prod.timberStockMovement.count(),
    transactions: await prod.timberSalesOrder.count() + await prod.stockTransfer.count() + await prod.stockAdjustment.count()
  };

  R.mutationSafety = {
    movementsDelta: afterCounts.movements - beforeCounts.movements,
    transactionsDelta: afterCounts.transactions - beforeCounts.transactions
  };

  console.log(JSON.stringify(R, null, 2));
  await prod.$disconnect();
}
run();
