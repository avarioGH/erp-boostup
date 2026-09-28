const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAudit() {
  const companyId = '6ab6a3c170de3c0b5cb580cf';
  const stockIds = ['6ab74eaa43a18100acfa3663', '6ab74eaa43a18100acfa3665'];
  const variantId = '6ab74eaa43a18100acfa3662';
  const batches = ['UAT-BATCH-A', 'UAT-BATCH-B'];
  const sku = 'UAT-4791-VAR';

  const result = {
    stockDependencies: {},
    variantDependencies: {},
    batchDependencies: {},
    legacyDependencies: {},
    tenantVerification: {}
  };

  try {
    const checkStockDep = async (m) => prisma[m] ? await prisma[m].count({ where: { timberStockId: { in: stockIds } } }).catch(() => 0) : 0;
    
    result.stockDependencies.timberStockMovement = await checkStockDep('timberStockMovement');
    result.stockDependencies.timberStockReservation = await checkStockDep('timberStockReservation');
    result.stockDependencies.timberShipmentItem = await checkStockDep('timberShipmentItem');
    result.stockDependencies.timberSalesOrderItem = await checkStockDep('timberSalesOrderItem');
    result.stockDependencies.stockTransferItem = await checkStockDep('stockTransferItem');
    result.stockDependencies.stockAdjustmentItem = await checkStockDep('stockAdjustmentItem');
    result.stockDependencies.timberStockOpnameItem = await checkStockDep('timberStockOpnameItem');
    result.stockDependencies.productionProcessInput = await checkStockDep('productionProcessInput');
    result.stockDependencies.productionProcessOutput = await checkStockDep('productionProcessOutput');

    const checkVarDep = async (m, extraWhere={}) => prisma[m] ? await prisma[m].count({ where: { timberVariantId: variantId, ...extraWhere } }).catch(() => 0) : 0;
    
    result.variantDependencies.timberStock = await checkVarDep('timberStock', { id: { notIn: stockIds } });
    result.variantDependencies.timberStockMovement = await checkVarDep('timberStockMovement');
    result.variantDependencies.sawnTimberOutputItem = await checkVarDep('sawnTimberOutputItem');
    result.variantDependencies.productionProcessInput = await checkVarDep('productionProcessInput');
    result.variantDependencies.productionProcessOutput = await checkVarDep('productionProcessOutput');
    result.variantDependencies.timberShipmentItem = await checkVarDep('timberShipmentItem');
    result.variantDependencies.timberPurchaseItem = await checkVarDep('timberPurchaseItem');
    result.variantDependencies.timberSalesOrderItem = await checkVarDep('timberSalesOrderItem');
    result.variantDependencies.timberStockReservation = await checkVarDep('timberStockReservation');

    const batchCheck = async (model) => prisma[model] ? await prisma[model].count({ where: { batch: { in: batches } } }).catch(() => 0) : 0;
    
    result.batchDependencies.rawLog = await batchCheck('rawLog');
    result.batchDependencies.trimmedLog = await batchCheck('trimmedLog');
    result.batchDependencies.inputLog = await batchCheck('inputLog');
    result.batchDependencies.sawnTimberOutput = await batchCheck('sawnTimberOutput');
    result.batchDependencies.productionProcess = await batchCheck('productionProcess');
    result.batchDependencies.timberPurchase = await batchCheck('timberPurchase');
    result.batchDependencies.timberShipment = await batchCheck('timberShipment');
    result.batchDependencies.stockTransfer = await batchCheck('stockTransfer');
    result.batchDependencies.stockAdjustment = await batchCheck('stockAdjustment');
    result.batchDependencies.timberStockOpname = await batchCheck('timberStockOpname');
    result.batchDependencies.timberSalesOrder = await batchCheck('timberSalesOrder');
    result.batchDependencies.timberStock = await batchCheck('timberStock');

    const stocks = await prisma.timberStock.findMany({
      where: { id: { in: stockIds } },
      include: { location: true }
    });
    
    const validTenant = stocks.every(s => s.location?.company_id === companyId);
    const gudangUtama = stocks.every(s => s.location?.name === 'Gudang Utama' || s.location?.code === 'GUDANG_UTAMA');
    result.tenantVerification = {
      count: stocks.length,
      allBoostupKayu: validTenant,
      allGudangUtama: gudangUtama,
      locations: stocks.map(s => ({ id: s.locationId, name: s.location?.name, companyId: s.location?.company_id }))
    };

    if (prisma.warehouseStock) {
       result.legacyDependencies.warehouseStock = await prisma.warehouseStock.count({ where: { OR: [ { batch: { in: batches } } ] } }).catch(() => 0);
       result.legacyDependencies.stockMovement = await prisma.stockMovement.count({ where: { OR: [ { batch: { in: batches } }, { referenceNumber: { in: batches } } ] } }).catch(() => 0);
       result.legacyDependencies.inventoryTransaction = await prisma.inventoryTransaction.count({ where: { OR: [ { referenceNumber: { in: batches } } ] } }).catch(() => 0);
    }

    console.log("JSON_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("JSON_END");
  } catch(e) {
    console.error("ERROR", e);
  } finally {
    await prisma.$disconnect();
  }
}
runAudit();
