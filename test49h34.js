const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const uat = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/uat_erp?retryWrites=true&w=majority&appName=erp-boostup' } } });
const prod = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup' } } });

async function run() {
  console.log('--- RECONCILIATION START ---');
  const output = {};

  output.safety = {
    uatDb: await uat.$runCommandRaw({ ping: 1 }),
    prodDb: await prod.$runCommandRaw({ ping: 1 })
  };

  const prodCounts = {
    timberStock: await prod.timberStock.count(),
    movements: await prod.timberStockMovement.count(),
    reservations: await prod.timberStockReservation.count(),
    orders: await prod.timberSalesOrder.count(),
    shipments: await prod.timberShipment.count(),
    production: await prod.productionProcess.count(),
    adjustments: await prod.stockAdjustment.count(),
    transfers: await prod.stockTransfer.count()
  };
  output.prodCounts = prodCounts;

  const stocks = await uat.timberStock.findMany({
    include: { location: true, timberVariant: true }
  });
  const movements = await uat.timberStockMovement.findMany();
  
  const recon = [];
  let allMatched = true;
  for (const s of stocks) {
    const sMovs = movements.filter(m => 
      m.timberStockId === s.id || 
      (m.locationId === s.locationId && m.timberVariantId === s.timberVariantId && m.batch === s.batch)
    );
    let ledgerPcs = 0;
    let ledgerM3 = 0;
    
    for (const m of sMovs) {
      if (m.type === 'IN') { ledgerPcs += m.quantityPcs; ledgerM3 += m.volumeM3; }
      else if (m.type === 'OUT') { ledgerPcs -= m.quantityPcs; ledgerM3 -= m.volumeM3; }
    }
    
    const match = s.currentPcs === ledgerPcs && Math.abs(s.currentVolumeM3 - ledgerM3) < 0.001;
    if(!match) allMatched = false;
    recon.push({
      id: s.id,
      batch: s.batch,
      stockPcs: s.currentPcs,
      ledgerPcs,
      stockM3: s.currentVolumeM3,
      ledgerM3,
      match
    });
  }
  output.stockRecon = { allMatched, details: recon };

  output.negativeStock = {
    minPcs: stocks.length > 0 ? Math.min(...stocks.map(s => s.currentPcs)) : 0,
    count: stocks.filter(s => s.currentPcs < 0).length
  };

  const adjs = await uat.stockAdjustment.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
  output.adjustments = adjs.map(a => ({
    number: a.adjustmentNumber, status: a.status, items: a.items.length, 
    movs: movements.filter(m => m.referenceId === a.id).map(m => m.referenceType)
  }));

  const trfs = await uat.stockTransfer.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
  output.transfers = trfs.map(t => ({
    number: t.transferNumber, status: t.status, 
    movs: movements.filter(m => m.referenceId === t.id).map(m => m.referenceType)
  }));

  const prods = await uat.productionProcess.findMany({ include: { inputs: true, outputs: true }, orderBy: { createdAt: 'desc' } });
  output.productions = prods.map(p => ({
    no: p.processNo, status: p.status, 
    inM3: p.inputs.reduce((sum, i) => sum + i.volumeM3, 0),
    outM3: p.outputs.reduce((sum, o) => sum + o.volumeM3, 0),
    movs: movements.filter(m => m.referenceId === p.id).map(m => m.referenceType)
  }));

  const orders = await uat.timberSalesOrder.findMany({ include: { items: true } });
  const ships = await uat.timberShipment.findMany({ include: { items: true } });
  output.sales = orders.map(o => ({
    order: o.orderNumber, status: o.status,
    items: o.items.map(i => ({ order: i.orderQty, realized: i.realizedQty }))
  }));
  output.shipments = ships.map(s => ({
    shipment: s.shipmentNumber, status: s.status,
    items: s.items.map(i => ({ shipped: i.quantityPcs, m3: i.volumeM3 }))
  }));

  const refs = {};
  let duplicates = 0;
  for (const m of movements) {
    const key = m.referenceId + '_' + m.referenceType + '_' + m.timberVariantId + '_' + m.batch;
    if (refs[key]) { refs[key]++; duplicates++; }
    else refs[key] = 1;
  }
  output.duplicates = duplicates;

  const inputLogs = await uat.inputLog.findMany();
  const inputVol = inputLogs.reduce((sum, l) => sum + (l.netVolumeM3 || 0), 0);
  const sawnOutputs = await uat.sawnTimberOutput.findMany({ include: { items: true } });
  const outputVol = sawnOutputs.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.volumeM3 || 0), 0), 0);
  output.yield = { inputVol, outputVol, pct: inputVol > 0 ? (outputVol/inputVol*100).toFixed(2) : 0 };

  console.log(JSON.stringify(output, null, 2));

  await uat.$disconnect();
  await prod.$disconnect();
}
run();
