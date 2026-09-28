const { PrismaClient } = require('@prisma/client');

const prod = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup' } } });
const uat = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/uat_erp?retryWrites=true&w=majority&appName=erp-boostup' } } });

async function runE2E() {
  const ts = Date.now();
  console.log("--- E2E UAT REGRESSION SCRIPT ---");
  
  const cId = (await uat.company.findFirst()).id;
  const wId = (await uat.warehouse.findFirst({where:{company_id:cId}})).id;
  const sId = (await uat.timberSource.findFirst({where:{company_id:cId}})).id;
  const variant = await uat.timberVariant.findFirst({where:{product:{company_id:cId}}});
  
  console.log("\n[A] SAWN TIMBER PURCHASE");
  const purchaseNo = `UAT-PURCHASE-50-3-3-${ts}`;
  const batchNo = `UAT-PURCHASE-BATCH-50-3-3-${ts}`;
  
  // Step A1: Create DRAFT Purchase
  const draft = await uat.timberPurchase.create({
    data: {
      company_id: cId,
      purchaseNumber: purchaseNo,
      purchaseDate: new Date(),
      sourceId: sId,
      warehouseId: wId,
      notes: 'Sawn timber regression test',
      status: 'DRAFT',
      totalPcs: 10,
      totalVolumeM3: variant.volumePerPiece * 10,
      items: {
        create: [{
          timberVariantId: variant.id,
          quantityPcs: 10,
          volumeM3: variant.volumePerPiece * 10,
          batch: batchNo,
          notes: 'Item 1 notes',
          purchaseThickness: 18,
          purchaseWidth: 95,
          purchaseLength: 980,
          unitPrice: 15000
        }]
      }
    },
    include: { items: true }
  });
  console.log(`Created Draft Purchase: ${draft.id}`);
  
  let item = draft.items[0];
  console.log(`Draft Item: T=${item.purchaseThickness}, W=${item.purchaseWidth}, P=${item.purchaseLength}, UnitPrice=${item.unitPrice}`);
  console.log(`Variant canonical: ${variant.thickness}x${variant.width}x${variant.length}`);
  console.log(`Volume M3: ${item.volumeM3} (Expected: ${variant.volumePerPiece * item.quantityPcs})`);
  
  const mvtDraft = await uat.timberStockMovement.count({ where: { referenceId: draft.id } });
  console.log(`Movements while DRAFT: ${mvtDraft}`);

  // Step A4: Confirm Purchase
  const mvt = await uat.timberStockMovement.create({
    data: {
      locationId: wId,
      timberVariantId: variant.id,
      type: 'IN',
      referenceType: 'TIMBER_PURCHASE',
      referenceId: draft.id,
      quantityPcs: 10,
      volumeM3: item.volumeM3,
      batch: batchNo,
      notes: 'Purchase confirmation'
    }
  });
  
  const stock = await uat.timberStock.upsert({
    where: { locationId_timberVariantId_batch: { locationId: wId, timberVariantId: variant.id, batch: batchNo } },
    update: { currentPcs: { increment: 10 }, currentVolumeM3: { increment: item.volumeM3 } },
    create: { locationId: wId, timberVariantId: variant.id, batch: batchNo, currentPcs: 10, currentVolumeM3: item.volumeM3 }
  });
  await uat.timberPurchase.update({ where: { id: draft.id }, data: { status: 'CONFIRMED' } });
  console.log(`Confirmed Purchase`);
  console.log(`Resulting Stock: PCS=${stock.currentPcs}, M3=${stock.currentVolumeM3}`);
  console.log(`Ledger Movement Type: ${mvt.type}, Batch: ${mvt.batch}`);

  console.log("\n[B] LOG PURCHASE");
  const logPurchaseNo = `UAT-LOG-PURCHASE-50-3-3-${ts}`;
  const logNo = `UAT-LOG-50-3-3-${ts}`;
  const logDraft = await uat.timberPurchase.create({
    data: {
      company_id: cId,
      purchaseNumber: logPurchaseNo,
      purchaseDate: new Date(),
      sourceId: sId,
      warehouseId: wId,
      notes: 'Log regression test',
      status: 'DRAFT',
      totalPcs: 1,
      totalVolumeM3: 0.5,
      logItems: {
        create: [{
          logNumber: logNo,
          species: 'Merbau',
          purchaseLength: 400,
          purchaseDiameter1: 40,
          purchaseDiameter2: 42,
          purchaseDiameter3: 41,
          purchaseDiameter4: 40,
          purchaseVolume: 0.5
        }]
      }
    }
  });
  console.log(`Created Log Purchase Draft: ${logDraft.id}`);
  
  let rawLogDraft = await uat.rawLog.findFirst({ where: { logNumber: logNo } });
  console.log(`RawLog before receive exists? ${!!rawLogDraft}`);
  
  // Step B3: Actual Receiving
  const pLogItem = await uat.timberPurchaseLogItem.findFirst({ where: { timberPurchaseId: logDraft.id } });
  const receivedLog = await uat.rawLog.create({
    data: {
      company_id: cId,
      logNumber: logNo,
      species: 'Merbau',
      length: 395,
      diameter1: 39,
      diameter2: 41,
      diameter3: 40,
      diameter4: 39,
      volume: 0.49,
      status: 'AVAILABLE',
      locationId: wId,
      purchaseLogItemId: pLogItem.id
    }
  });
  console.log(`Received Log ID: ${receivedLog.id}`);
  console.log(`Actual Dims: L=${receivedLog.length}, D1=${receivedLog.diameter1}`);
  console.log(`Declared Dims (pLogItem): L=${pLogItem.purchaseLength}, D1=${pLogItem.purchaseDiameter1}`);

  console.log("\n[M] PRODUCTION SAFETY");
  const pCount = await prod.timberPurchase.count();
  const pMvt = await prod.timberStockMovement.count();
  console.log(`Production Purchases: ${pCount}, Movements: ${pMvt}`);

  prod.$disconnect(); uat.$disconnect();
}
runE2E().catch(console.error);
