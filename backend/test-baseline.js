const { PrismaClient } = require('@prisma/client');
const prod = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup' } } });
const uat = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/uat_erp?retryWrites=true&w=majority&appName=erp-boostup' } } });

async function run() {
  const models = [
    'company', 'warehouse', 'location', 'timberSpecies', 'timberGrade', 'timberSource', 'timberVariant',
    'timberStock', 'timberStockMovement', 'timberPurchase', 'timberPurchaseLogItem', 'rawLog', 'trimmedLog',
    'inputLog', 'sawnTimberOutput', 'sawnTimberOutputItem', 'timberSalesOrder', 'timberSalesOrderItem',
    'timberStockReservation', 'timberShipment', 'timberShipmentItem', 'stockAdjustment', 'stockAdjustmentItem',
    'stockTransfer', 'stockTransferItem', 'productionProcess', 'productionProcessInput', 'productionProcessOutput',
    'timberStockOpname', 'timberStockOpnameItem'
  ];
  
  console.log("PRODUCTION COUNTS:");
  for (const m of models) {
    if (prod[m]) {
      const c = await prod[m].count();
      console.log(`${m}: ${c}`);
    }
  }

  // Cross contamination check
  const prodCompanyId = '6ab6a3c170de3c0b5cb580cf';
  const uatCompanyId = '6ab79d610c6db3e45bbdf53b';

  const uatInProd = await prod.company.count({ where: { id: uatCompanyId } });
  const prodInUat = await uat.company.count({ where: { id: prodCompanyId } });
  
  console.log(`\nContamination: UAT in Prod = ${uatInProd}, Prod in UAT = ${prodInUat}`);

  // Negative Stock Check Prod
  let negStock = 0;
  if (prod.timberStock) {
    negStock = await prod.timberStock.count({
      where: {
        OR: [
          { currentPcs: { lt: 0 } },
          { currentVolumeM3: { lt: 0 } }
        ]
      }
    });
  }
  console.log(`Negative Stock Prod: ${negStock}`);

  prod.$disconnect(); uat.$disconnect();
}
run();
