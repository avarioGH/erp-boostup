const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function checkFinal() {
  const envContent = fs.readFileSync('/root/erp-boostup/backend/.env', 'utf-8');
  const dbUrlLine = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
  const rawUrl = dbUrlLine.substring(dbUrlLine.indexOf('=') + 1).trim().replace(/['"]/g, '');
  
  const urlObj = new URL(rawUrl);
  urlObj.pathname = '/uat_erp';
  const uatUrl = urlObj.toString();

  const prodPrisma = new PrismaClient({ datasources: { db: { url: rawUrl } } });
  const uatPrisma = new PrismaClient({ datasources: { db: { url: uatUrl } } });

  const prodBaseline = {
    company: await prodPrisma.company.count(),
    warehouse: await prodPrisma.warehouse.count(),
    location: await prodPrisma.location.count(),
    timberStock: await prodPrisma.timberStock.count(),
    timberStockMovement: await prodPrisma.timberStockMovement.count(),
    timberVariant: await prodPrisma.timberVariant.count(),
    rawLog: await prodPrisma.rawLog?.count().catch(()=>0),
    trimmedLog: await prodPrisma.trimmedLog?.count().catch(()=>0),
    inputLog: await prodPrisma.inputLog?.count().catch(()=>0),
    sawnTimberOutput: await prodPrisma.sawnTimberOutput?.count().catch(()=>0),
    timberPurchase: await prodPrisma.timberPurchase?.count().catch(()=>0),
    timberShipment: await prodPrisma.timberShipment?.count().catch(()=>0),
    timberStockReservation: await prodPrisma.timberStockReservation?.count().catch(()=>0),
    stockAdjustment: await prodPrisma.stockAdjustment?.count().catch(()=>0),
    stockTransfer: await prodPrisma.stockTransfer?.count().catch(()=>0),
    productionProcess: await prodPrisma.productionProcess?.count().catch(()=>0),
  };

  const uatBaseline = {
    company: await uatPrisma.company.count(),
    warehouse: await uatPrisma.warehouse.count(),
    location: await uatPrisma.location.count(),
    timberStock: await uatPrisma.timberStock.count(),
    timberStockMovement: await uatPrisma.timberStockMovement.count(),
    timberVariant: await uatPrisma.timberVariant.count(),
    product: await uatPrisma.product.count(),
    unit: await uatPrisma.unit.count(),
    rawLog: await uatPrisma.rawLog?.count().catch(()=>0),
    timberSource: await uatPrisma.timberSource.count(),
    vehicle: await uatPrisma.vehicle.count(),
    driver: await uatPrisma.driver.count(),
    timberSpecies: await uatPrisma.timberSpecies.count(),
    timberGrade: await uatPrisma.timberGrade.count(),
    role: await uatPrisma.role.count(),
    user: await uatPrisma.user.count(),
    warehouse_count: await uatPrisma.warehouse.count(),
    location_count: await uatPrisma.location.count(),
  };

  const uatCompany = await uatPrisma.company.findFirst();
  const uatVariant = await uatPrisma.timberVariant.findFirst({ include: { timberSpecies: true, timberGrade: true } });
  const uatUser = await uatPrisma.user.findFirst({ include: { role: true } });
  const uatWarehouse = await uatPrisma.warehouse.findFirst();
  const uatLocation = await uatPrisma.location.findFirst();

  console.log("JSON_START");
  console.log(JSON.stringify({
    prodFinal: prodBaseline,
    uatFinal: uatBaseline,
    uatCompanyDetail: { id: uatCompany?.id, name: uatCompany?.name },
    uatVariantDetail: {
      id: uatVariant?.id,
      sku: uatVariant?.sku,
      grade: uatVariant?.grade,
      species: uatVariant?.species,
      thickness: uatVariant?.thickness,
      width: uatVariant?.width,
      length: uatVariant?.length,
      volumePerPiece: uatVariant?.volumePerPiece
    },
    uatUserDetail: { id: uatUser?.id, username: uatUser?.username, role: uatUser?.role?.name },
    uatWarehouseDetail: { id: uatWarehouse?.id, code: uatWarehouse?.code },
    uatLocationDetail: { id: uatLocation?.id, code: uatLocation?.code },
  }, null, 2));
  console.log("JSON_END");

  await prodPrisma.$disconnect();
  await uatPrisma.$disconnect();
}
checkFinal().catch(e => console.error('ERROR:', e.message));
