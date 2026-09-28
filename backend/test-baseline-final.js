const { PrismaClient } = require('@prisma/client');
const prod = new PrismaClient({ datasources: { db: { url: 'mongodb+srv://boostupidofficial_db_user:Fg32mARZWVdXb0aa@erp-boostup.qbaqxyw.mongodb.net/erp_db?retryWrites=true&w=majority&appName=erp-boostup' } } });

async function run() {
  const models = [
    'company', 'warehouse', 'location', 'timberSpecies', 'timberGrade', 'timberSource', 'timberVariant',
    'timberStock', 'timberStockMovement', 'timberPurchase', 'timberPurchaseLogItem', 'rawLog', 'trimmedLog',
    'inputLog', 'sawnTimberOutput', 'sawnTimberOutputItem', 'timberSalesOrder', 'timberSalesOrderItem',
    'timberShipment', 'timberShipmentItem', 'stockAdjustment', 'stockAdjustmentItem',
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

  prod.$disconnect();
}
run();
