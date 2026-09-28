const { PrismaClient } = require('@prisma/client');
const { PurchaseService } = require('./src/inventory/purchase/purchase.service');
const { InventoryLedgerService } = require('./src/inventory/inventory-ledger.service');
const { LogsService } = require('./src/inventory/logs.service');
const { AuditService } = require('./src/monitoring/audit.service');

const prod = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup' } } });
const uat = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/uat_erp?retryWrites=true&w=majority&appName=erp-boostup' } } });

const auditService = new AuditService(uat);
const ledgerService = new InventoryLedgerService(uat);
const purchaseService = new PurchaseService(uat, ledgerService);
const logsService = new LogsService(uat, ledgerService, auditService);

async function runE2E() {
  const ts = Date.now();
  console.log("--- E2E UAT REGRESSION SCRIPT ---");
  
  const cId = (await uat.company.findFirst()).id;
  const wId = (await uat.warehouse.findFirst({where:{company_id:cId}})).id;
  const sId = (await uat.timberSource.findFirst({where:{company_id:cId}})).id;
  const variant = await uat.timberVariant.findFirst({where:{product:{company_id:cId}}});

  console.log(`UAT Company: ${cId}, Warehouse: ${wId}, Source: ${sId}, Variant: ${variant.id}`);
  
  console.log("\n[A] SAWN TIMBER PURCHASE");
  const purchaseNo = `UAT-PURCHASE-50-3-3-${ts}`;
  const batchNo = `UAT-PURCHASE-BATCH-50-3-3-${ts}`;
  
  const draft = await purchaseService.create(cId, {
    purchaseNumber: purchaseNo,
    sourceId: sId,
    warehouseId: wId,
    notes: 'Sawn timber regression test',
    items: [{
      timberVariantId: variant.id,
      quantityPcs: 10,
      batch: batchNo,
      notes: 'Item 1 notes',
      purchaseThickness: 18,
      purchaseWidth: 95,
      purchaseLength: 980,
      unitPrice: 15000
    }]
  });
  console.log(`Created Draft Purchase: ${draft.id}`);
  
  let item = draft.items[0];
  console.log(`Draft Item: T=${item.purchaseThickness}, W=${item.purchaseWidth}, P=${item.purchaseLength}`);
  console.log(`Variant canonical: ${variant.thickness}x${variant.width}x${variant.length}`);
  console.log(`Volume M3: ${item.volumeM3} (Expected: ${variant.volumePerPiece * item.quantityPcs})`);
  
  const mvtDraft = await uat.timberStockMovement.count({ where: { referenceId: draft.id } });
  console.log(`Movements while DRAFT: ${mvtDraft}`);

  await purchaseService.confirm(draft.id, cId);
  console.log(`Confirmed Purchase`);
  
  const mvtConf = await uat.timberStockMovement.findMany({ where: { referenceId: draft.id } });
  console.log(`Movements after CONFIRM: ${mvtConf.length}`);
  if (mvtConf.length > 0) {
    console.log(`Movement Type: ${mvtConf[0].type}, SubType: ${mvtConf[0].referenceType}, Batch: ${mvtConf[0].batch}`);
  }
  
  const stock = await uat.timberStock.findUnique({ where: { locationId_timberVariantId_batch: { locationId: wId, timberVariantId: variant.id, batch: batchNo } } });
  console.log(`Resulting Stock: PCS=${stock?.currentPcs}, M3=${stock?.currentVolumeM3}`);

  console.log("\n[B] LOG PURCHASE");
  const logPurchaseNo = `UAT-LOG-PURCHASE-50-3-3-${ts}`;
  const logNo = `UAT-LOG-50-3-3-${ts}`;
  const logDraft = await purchaseService.create(cId, {
    purchaseNumber: logPurchaseNo,
    sourceId: sId,
    warehouseId: wId,
    notes: 'Log regression test',
    items: [],
    logItems: [{
      logNumber: logNo,
      species: 'Merbau',
      purchaseLength: 400,
      purchaseDiameter1: 40,
      purchaseDiameter2: 42,
      purchaseDiameter3: 41,
      purchaseDiameter4: 40,
      purchaseVolume: 0.5
    }]
  });
  console.log(`Created Log Purchase Draft: ${logDraft.id}`);
  
  let rawLogDraft = await uat.rawLog.findFirst({ where: { logNumber: logNo } });
  console.log(`RawLog before receive exists? ${!!rawLogDraft}`);

  await purchaseService.confirm(logDraft.id, cId);
  console.log(`Confirmed Log Purchase`);
  rawLogDraft = await uat.rawLog.findFirst({ where: { logNumber: logNo } });
  console.log(`RawLog after confirm (before receive) exists? ${!!rawLogDraft}`);

  const pLogItem = await uat.timberPurchaseLogItem.findFirst({ where: { timberPurchaseId: logDraft.id } });
  
  // Receive Log
  const user = await uat.user.findFirst();
  const receivedLog = await logsService.receiveLog({
    purchaseId: logDraft.id,
    purchaseLogItemId: pLogItem.id,
    logNumber: logNo,
    species: 'Merbau',
    actualLength: 395,
    actualDiameter1: 39,
    actualDiameter2: 41,
    actualDiameter3: 40,
    actualDiameter4: 39,
    locationId: wId,
    companyId: cId
  }, user.id);
  console.log(`Received Log ID: ${receivedLog.id}`);
  console.log(`Actual Dims: L=${receivedLog.length}, D1=${receivedLog.diameter1}`);
  console.log(`Declared Dims (pLogItem): L=${pLogItem.purchaseLength}, D1=${pLogItem.purchaseDiameter1}`);

  try {
    await logsService.receiveLog({
      purchaseId: logDraft.id,
      purchaseLogItemId: pLogItem.id,
      logNumber: logNo,
      species: 'Merbau',
      actualLength: 395,
      locationId: wId,
      companyId: cId
    }, user.id);
    console.log(`FAIL: Duplicate Receiving succeeded!`);
  } catch(e) {
    console.log(`PASS: Duplicate Receiving rejected.`);
  }

  console.log("\n[H] NEGATIVE VALIDATION");
  try {
    await purchaseService.create(cId, {
      purchaseNumber: `INVALID-${ts}`,
      sourceId: sId,
      warehouseId: wId,
      items: [{ timberVariantId: variant.id, quantityPcs: 10, batch: 'B', purchaseThickness: -1 }]
    });
    console.log("FAIL: Accepted -1 thickness");
  } catch(e) { console.log("PASS: Rejected -1 thickness"); }
  
  try {
    await purchaseService.create(cId, {
      purchaseNumber: `INVALID-${ts}`,
      sourceId: sId,
      warehouseId: wId,
      items: [{ timberVariantId: variant.id, quantityPcs: -10, batch: 'B' }]
    });
    console.log("FAIL: Accepted -10 quantity");
  } catch(e) { console.log("PASS: Rejected -10 quantity"); }
  
  console.log("\n[I] TENANT ISOLATION");
  const prodWId = (await prod.warehouse.findFirst()).id;
  try {
    await purchaseService.create(cId, {
      purchaseNumber: `INVALID-TENANT-${ts}`,
      sourceId: sId,
      warehouseId: prodWId, // prod warehouse
      items: [{ timberVariantId: variant.id, quantityPcs: 10, batch: 'B' }]
    });
    console.log("FAIL: Accepted Production Warehouse");
  } catch(e) { console.log("PASS: Rejected Production Warehouse"); }

  console.log("\n[M] PRODUCTION SAFETY");
  const pCount = await prod.timberPurchase.count();
  const pMvt = await prod.timberStockMovement.count();
  console.log(`Production Purchases: ${pCount}, Movements: ${pMvt}`);

  console.log("\n[K] CANCELLATION");
  try {
    await purchaseService.cancel(draft.id, cId);
    console.log("Cancelled Purchase");
    const cStock = await uat.timberStock.findUnique({ where: { locationId_timberVariantId_batch: { locationId: wId, timberVariantId: variant.id, batch: batchNo } } });
    console.log(`Stock after cancel: PCS=${cStock?.currentPcs}`);
  } catch(e) {
    console.log("Cancellation unsupported or failed: " + e.message);
  }

  prod.$disconnect(); uat.$disconnect();
}
runE2E().catch(console.error);
