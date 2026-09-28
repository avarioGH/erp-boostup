const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAudit() {
  const companyId = '6ab6a3c170de3c0b5cb580cf';
  const result = {
    orphanStocks: [],
    sawnTimberOutput: null,
    inputLog: null,
    legacy: { warehouseStock: [], stockMovement: [] },
    schemaAvailability: {},
    prismaKeys: Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$') && k !== 'disconnect')
  };

  try {
    const stocks = await prisma.timberStock.findMany({
      where: { location: { company_id: companyId } },
      include: { location: true, timberVariant: { include: { product: true } } }
    });
    
    for (const stock of stocks) {
       const movements = await prisma.timberStockMovement.findMany({ where: { timberStockId: stock.id } });
       result.orphanStocks.push({
         id: stock.id,
         warehouseName: stock.location?.name,
         timberVariantId: stock.timberVariantId,
         sku: stock.timberVariant?.sku,
         species: stock.timberVariant?.species,
         grade: stock.timberVariant?.grade,
         thickness: stock.timberVariant?.thicknessMm,
         width: stock.timberVariant?.widthMm,
         length: stock.timberVariant?.lengthMm,
         batch: stock.batch,
         currentPcs: stock.currentPcs,
         currentVolumeM3: stock.currentVolumeM3,
         createdAt: stock.createdAt,
         updatedAt: stock.updatedAt,
         movementCount: movements.length,
         variantCreatedAt: stock.timberVariant?.createdAt
       });
    }

    const output = await prisma.sawnTimberOutput.findFirst({
       where: { location: { company_id: companyId } },
       include: { items: true, location: true }
    });
    if (output) {
       result.sawnTimberOutput = {
         id: output.id,
         status: output.status,
         batch: output.batch,
         itemsCount: output.items.length,
         createdAt: output.createdAt,
         items: output.items.map(i => ({
           variantId: i.timberVariantId,
           pcs: i.quantityPcs,
           m3: i.volumeM3
         }))
       };
    }

    const input = await prisma.inputLog.findFirst({
       where: { location: { company_id: companyId } }
    });
    if (input) {
       result.inputLog = {
         id: input.id,
         totalVolume: input.totalVolume,
         createdAt: input.createdAt
       };
    }

    const testModel = async (modelName) => {
       if (!prisma[modelName]) return 'MODEL_UNAVAILABLE';
       try {
          await prisma[modelName].findFirst();
          return 'AVAILABLE';
       } catch (e) {
          return 'QUERY_ERROR: ' + String(e.message).substring(0, 100);
       }
    };
    result.schemaAvailability.timberPurchase = await testModel('timberPurchase');
    result.schemaAvailability.timberShipment = await testModel('timberShipment');
    result.schemaAvailability.timberStockReservation = await testModel('timberStockReservation');

    if (prisma.warehouseStock) {
       const wStocks = await prisma.warehouseStock.findMany({ 
          where: { current_stock: { in: stocks.map(s => s.currentPcs) } }
       });
       result.legacy.warehouseStock = wStocks.map(w => ({ id: w.id, productId: w.product_id, qty: w.current_stock }));
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
