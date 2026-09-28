const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runUAT() {
  const result = {
    baselineBefore: {},
    baselineAfter: {},
    companies: [],
    boostupKayuSafety: {},
    uatTenantAssessment: {},
    warehouses: [],
    locations: [],
    historicalUat: [],
    legacyInputLog: {},
    mutations: { inserts: 0, updates: 0, deletes: 0, upserts: 0, migrations: 0, stockMutations: 0, ledgerMutations: 0 }
  };

  try {
    const getBaseline = async () => ({
      company: await prisma.company.count(),
      warehouse: await prisma.warehouse.count(),
      location: await prisma.location.count(),
      timberStock: await prisma.timberStock.count(),
      timberStockMovement: await prisma.timberStockMovement.count(),
      timberVariant: await prisma.timberVariant.count(),
      rawLog: await prisma.rawLog?.count().catch(()=>0),
      trimmedLog: await prisma.trimmedLog?.count().catch(()=>0),
      inputLog: await prisma.inputLog?.count().catch(()=>0),
      sawnTimberOutput: await prisma.sawnTimberOutput?.count().catch(()=>0),
      timberPurchase: await prisma.timberPurchase?.count().catch(()=>0),
      timberShipment: await prisma.timberShipment?.count().catch(()=>0),
      timberStockReservation: await prisma.timberStockReservation?.count().catch(()=>0),
      stockAdjustment: await prisma.stockAdjustment?.count().catch(()=>0),
      stockTransfer: await prisma.stockTransfer?.count().catch(()=>0),
      productionProcess: await prisma.productionProcess?.count().catch(()=>0),
    });

    result.baselineBefore = await getBaseline();

    const companies = await prisma.company.findMany();
    for (const c of companies) {
      const stock = await prisma.timberStock.count({ where: { location: { company_id: c.id } }});
      const ledger = await prisma.timberStockMovement.count({ where: { timberStock: { location: { company_id: c.id } } }});
      const purchase = await prisma.timberPurchase?.count({ where: { company_id: c.id } }).catch(()=>0);
      const shipment = await prisma.timberShipment?.count({ where: { company_id: c.id } }).catch(()=>0);
      
      let classification = 'UNKNOWN';
      if (c.name.toLowerCase().includes('boostup kayu')) classification = 'BUSINESS TENANT';
      else if (c.name.toLowerCase().includes('uat') || c.name.toLowerCase().includes('test')) classification = 'UAT CANDIDATE';
      else if (c.name.toLowerCase().includes('system') || c.name.toLowerCase().includes('admin')) classification = 'SYSTEM / INTERNAL';
      else classification = 'BUSINESS TENANT';

      result.companies.push({ id: c.id, name: c.name, classification, stock, ledger, purchase, shipment });
    }

    result.boostupKayuSafety = result.companies.find(c => c.id === '6ab6a3c170de3c0b5cb580cf') || null;

    result.warehouses = await prisma.warehouse.findMany({ select: { id: true, code: true, name: true, company_id: true } });
    result.locations = await prisma.location.findMany({ select: { id: true, code: true, name: true, warehouseId: true } });

    const uatVariants = await prisma.timberVariant.findMany({ where: { OR: [{ sku: { contains: 'UAT' } }, { sku: { contains: 'TEST' } }] }});
    const uatMovements = await prisma.timberStockMovement.findMany({ where: { batch: { contains: 'UAT' } }});
    result.historicalUat = { variants: uatVariants.map(v => v.sku), movements: uatMovements.length };

    if (prisma.inputLog) {
        const legacyLog = await prisma.inputLog.findUnique({ where: { id: '6ab6b9286e666926ba2d1e8e' }, include: { items: { include: { trimmedLog: true } }, sawnOutputs: true } });
        if (legacyLog) {
            result.legacyInputLog = {
                id: legacyLog.id,
                totalVolume: legacyLog.totalVolume,
                itemsCount: legacyLog.items.length,
                hasSawnTimberOutputs: legacyLog.sawnOutputs?.length > 0,
                expectedInputNet: legacyLog.items.reduce((sum, item) => sum + ((item.trimmedLog?.grossVolume || 0) - (item.trimmedLog?.hollowVolume || 0)), 0)
            };
        }
    }

    result.baselineAfter = await getBaseline();
    
    console.log("JSON_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("JSON_END");
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}
runUAT();
