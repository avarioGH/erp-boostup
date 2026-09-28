const { PrismaClient } = require('@prisma/client');
const { PurchaseService } = require('./src/inventory/purchase/purchase.service');
const { InventoryLedgerService } = require('./src/inventory/inventory-ledger.service');

const prisma = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/uat_erp?retryWrites=true&w=majority&appName=erp-boostup' } } });
const ledgerService = new InventoryLedgerService(prisma);
const purchaseService = new PurchaseService(prisma, ledgerService);

async function runTest() {
  const company = await prisma.company.findFirst();
  const cId = company.id;
  const warehouse = await prisma.warehouse.findFirst({ where: { company_id: cId } });
  const source = await prisma.timberSource.findFirst({ where: { company_id: cId } });
  
  // Find variant 20x100x1000 or create one
  let variant = await prisma.timberVariant.findFirst({
    where: { thickness: 20, width: 100, length: 1000, product: { company_id: cId } },
    include: { product: true }
  });

  const payload = {
    purchaseNumber: `TEST-PURCH-${Date.now()}`,
    sourceId: source.id,
    warehouseId: warehouse.id,
    notes: 'UAT supplier declaration test',
    items: [
      {
        timberVariantId: variant.id,
        quantityPcs: 10,
        batch: 'UAT-PURCHASE-BATCH-TEST',
        notes: 'UAT supplier declaration test',
        purchaseThickness: 18,
        purchaseWidth: 95,
        purchaseLength: 980,
        unitPrice: 150000
      }
    ]
  };

  try {
    // 1. Validation test (negative quantity)
    payload.items[0].quantityPcs = -1;
    await purchaseService.create(cId, payload);
    console.log("FAIL: Accepted -1 quantity");
  } catch(e) {
    console.log("PASS validation quantity -1");
  }

  try {
    // 2. Validation test (negative thickness)
    payload.items[0].quantityPcs = 10;
    payload.items[0].purchaseThickness = -5;
    await purchaseService.create(cId, payload);
    console.log("FAIL: Accepted -5 thickness");
  } catch(e) {
    console.log("PASS validation thickness -5");
  }

  // Restore payload
  payload.items[0].purchaseThickness = 18;

  // 3. Create real purchase
  const draft = await purchaseService.create(cId, payload);
  console.log(`Created draft purchase: ${draft.id}`);
  
  // Verify persistence
  const item = draft.items[0];
  console.log(`Persisted item: T=${item.purchaseThickness}, W=${item.purchaseWidth}, L=${item.purchaseLength}, UnitPrice=${item.unitPrice}, Batch=${item.batch}, Notes=${item.notes}`);

  // 4. Verify variant immutability
  const variantAfter = await prisma.timberVariant.findUnique({ where: { id: variant.id } });
  console.log(`Variant after: T=${variantAfter.thickness}, W=${variantAfter.width}, L=${variantAfter.length}`);

  // 5. Volume Semantics
  console.log(`PurchaseItem volumeM3 = ${item.volumeM3} (Variant vol = ${variantAfter.volumePerPiece}) -> ${item.volumeM3 === variantAfter.volumePerPiece * 10 ? 'Matches Canonical' : 'Mismatch'}`);

  // 6. Confirmation Regression
  const initialStock = await prisma.timberStock.findUnique({ where: { locationId_timberVariantId_batch: { locationId: warehouse.id, timberVariantId: variant.id, batch: 'UAT-PURCHASE-BATCH-TEST' } } });
  const startPcs = initialStock ? initialStock.currentPcs : 0;
  console.log(`Stock before confirm: ${startPcs}`);
  
  await purchaseService.confirm(draft.id, cId);
  const afterStock = await prisma.timberStock.findUnique({ where: { locationId_timberVariantId_batch: { locationId: warehouse.id, timberVariantId: variant.id, batch: 'UAT-PURCHASE-BATCH-TEST' } } });
  console.log(`Stock after confirm: ${afterStock.currentPcs} (expected ${startPcs + 10})`);
  
  const mvt = await prisma.timberStockMovement.findFirst({ where: { referenceId: draft.id, type: 'IN' } });
  console.log(`Ledger movement: Type=${mvt.type}, Batch=${mvt.batch}`);

  await prisma.$disconnect();
}
runTest();
