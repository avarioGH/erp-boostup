const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runCleanup() {
  const result = { logs: [], steps: {}, metrics: {} };
  const log = (msg) => result.logs.push(msg);

  const companyId = '6ab6a3c170de3c0b5cb580cf';
  const locationId = '6ab6b4e388f1d1c732d915c8';
  const variantId = '6ab74eaa43a18100acfa3662';
  const sku = 'UAT-4791-VAR';
  const s1 = { id: '6ab74eaa43a18100acfa3663', batch: 'UAT-BATCH-A', pcs: 100, m3: 0.8 };
  const s2 = { id: '6ab74eaa43a18100acfa3665', batch: 'UAT-BATCH-B', pcs: 50, m3: 0.4 };

  try {
    const preStocks = await prisma.timberStock.groupBy({ by: ['locationId'], _count: { id: true } });
    const preVariants = await prisma.timberVariant.count({ where: { company_id: companyId }});
    result.metrics.preStocks = preStocks;
    result.metrics.preVariants = preVariants;
    result.metrics.preMovements = await prisma.timberStockMovement.count();

    const stock1 = await prisma.timberStock.findUnique({ where: { id: s1.id }, include: { location: true } });
    const stock2 = await prisma.timberStock.findUnique({ where: { id: s2.id }, include: { location: true } });

    if (!stock1 || !stock2) throw new Error("Stocks not found!");
    if (stock1.location?.company_id !== companyId || stock1.locationId !== locationId || stock1.timberVariantId !== variantId || stock1.batch !== s1.batch || stock1.currentPcs !== s1.pcs || Math.abs(stock1.currentVolumeM3 - s1.m3) > 0.0001) throw new Error("Stock 1 metadata mismatch!");
    if (stock2.location?.company_id !== companyId || stock2.locationId !== locationId || stock2.timberVariantId !== variantId || stock2.batch !== s2.batch || stock2.currentPcs !== s2.pcs || Math.abs(stock2.currentVolumeM3 - s2.m3) > 0.0001) throw new Error("Stock 2 metadata mismatch!");

    log("Pre-flight metadata verified.");

    const checkStockDep = async (m) => prisma[m] ? await prisma[m].count({ where: { timberStockId: { in: [s1.id, s2.id] } } }).catch(() => 0) : 0;
    let sumDep = 0;
    for (const m of ['timberStockMovement', 'timberStockReservation', 'timberShipmentItem', 'timberSalesOrderItem', 'stockTransferItem', 'stockAdjustmentItem', 'timberStockOpnameItem', 'productionProcessInput', 'productionProcessOutput']) {
       sumDep += await checkStockDep(m);
    }
    if (sumDep > 0) throw new Error("Stock dependencies found!");

    const checkVarDep = async (m) => prisma[m] ? await prisma[m].count({ where: { timberVariantId: variantId } }).catch(() => 0) : 0;
    let sumVarDep = 0;
    for (const m of ['timberStockMovement', 'sawnTimberOutputItem', 'timberShipmentItem', 'timberPurchaseItem', 'timberSalesOrderItem', 'timberStockReservation', 'productionProcessInput', 'productionProcessOutput']) {
       sumVarDep += await checkVarDep(m);
    }
    const otherStocks = await prisma.timberStock.count({ where: { timberVariantId: variantId, id: { notIn: [s1.id, s2.id] } } });
    if (sumVarDep > 0 || otherStocks > 0) throw new Error("Variant dependencies found!");

    log("Dependency check passed.");

    const delS1 = await prisma.timberStock.deleteMany({
      where: { id: s1.id, locationId, timberVariantId: variantId, batch: s1.batch, currentPcs: s1.pcs }
    });
    if (delS1.count !== 1) throw new Error("Failed to delete Stock 1 safely");
    log("Deleted Stock 1");

    const delS2 = await prisma.timberStock.deleteMany({
      where: { id: s2.id, locationId, timberVariantId: variantId, batch: s2.batch, currentPcs: s2.pcs }
    });
    if (delS2.count !== 1) throw new Error("Failed to delete Stock 2 safely");
    log("Deleted Stock 2");

    const delV = await prisma.timberVariant.deleteMany({
      where: { id: variantId, company_id: companyId, sku: sku }
    });
    if (delV.count !== 1) throw new Error("Failed to delete Variant safely");
    log("Deleted Variant");

    const postStocks = await prisma.timberStock.groupBy({ by: ['locationId'], _count: { id: true } });
    const postVariants = await prisma.timberVariant.count({ where: { company_id: companyId }});
    result.metrics.postStocks = postStocks;
    result.metrics.postVariants = postVariants;
    result.metrics.postMovements = await prisma.timberStockMovement.count();

    log("Cleanup successful");
    result.status = 'PASS';

    console.log("JSON_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("JSON_END");

  } catch(e) {
    result.status = 'FAIL';
    result.error = e.message;
    console.log("JSON_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("JSON_END");
  } finally {
    await prisma.$disconnect();
  }
}
runCleanup();
