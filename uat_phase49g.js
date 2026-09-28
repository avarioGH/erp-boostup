const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runUAT() {
  const companyId = '6ab6a3c170de3c0b5cb580cf';
  const result = {
    baselineBefore: {},
    baselineAfter: {},
    dashboardIsolation: {},
    inputLogRuntime: { checked: 0, matches: 0, mismatches: 0, details: [] },
    yieldRuntime: { checked: 0, calculations: [], details: [] },
    adjustmentForensics: { cancelled: 0, adjReversalCount: 0, details: [] },
    stockCardRuntime: { checked: 0, details: [] },
    reconciliation: [],
    negativeStock: 0,
    batchIntegrity: { status: 'NOT PROVEN' },
    mutations: { inserts: 0, updates: 0, deletes: 0, upserts: 0, migrations: 0, stockMutations: 0, ledgerMutations: 0 }
  };

  try {
    const getBaseline = async () => ({
      company: await prisma.company.count(),
      timberStock: await prisma.timberStock.count(),
      timberStockMovement: await prisma.timberStockMovement.count(),
      timberVariant: await prisma.timberVariant.count(),
      rawLog: await prisma.rawLog?.count().catch(()=>0),
      trimmedLog: await prisma.trimmedLog?.count().catch(()=>0),
      inputLog: await prisma.inputLog?.count().catch(()=>0),
      sawnTimberOutput: await prisma.sawnTimberOutput?.count().catch(()=>0),
      sawnTimberOutputItem: await prisma.sawnTimberOutputItem?.count().catch(()=>0),
      timberPurchase: await prisma.timberPurchase?.count().catch(()=>0),
      timberShipment: await prisma.timberShipment?.count().catch(()=>0),
      timberShipmentItem: await prisma.timberShipmentItem?.count().catch(()=>0),
      timberStockReservation: await prisma.timberStockReservation?.count().catch(()=>0),
      stockAdjustment: await prisma.stockAdjustment?.count().catch(()=>0),
      stockTransfer: await prisma.stockTransfer?.count().catch(()=>0),
      productionProcess: await prisma.productionProcess?.count().catch(()=>0),
    });

    result.baselineBefore = await getBaseline();

    const globalStocks = await prisma.timberStock.count();
    const tenantStocks = await prisma.timberStock.count({ where: { location: { company_id: companyId } } });
    result.dashboardIsolation = { globalStocks, tenantStocks };

    if (prisma.inputLog) {
        const inputLogs = await prisma.inputLog.findMany({ include: { items: { include: { trimmedLog: true } } } });
        for (const log of inputLogs) {
            result.inputLogRuntime.checked++;
            const expectedTotal = log.items.reduce((sum, item) => sum + ((item.trimmedLog?.grossVolume || 0) - (item.trimmedLog?.hollowVolume || 0)), 0);
            if (Math.abs(expectedTotal - log.totalVolume) < 0.001) {
                result.inputLogRuntime.matches++;
            } else {
                result.inputLogRuntime.mismatches++;
                result.inputLogRuntime.details.push({ id: log.id, expected: expectedTotal, actual: log.totalVolume });
            }
        }
    }

    if (prisma.sawnTimberOutput) {
        const outputs = await prisma.sawnTimberOutput.findMany({ where: { status: 'POSTED' }, include: { inputLog: true, items: true } });
        for (const out of outputs) {
            result.yieldRuntime.checked++;
            const input = out.inputLog?.totalVolume || 0;
            const outputM3 = out.items.reduce((sum, i) => (i.grade && i.grade.toUpperCase() === 'WASTE') ? sum : sum + (i.volumeM3 || 0), 0);
            const yieldPct = input > 0 ? (outputM3 / input) * 100 : 0;
            result.yieldRuntime.calculations.push({ id: out.id, input, outputM3, yieldPct });
        }
    }

    if (prisma.stockAdjustment) {
        const cancelled = await prisma.stockAdjustment.findMany({ where: { status: 'CANCELLED' } });
        result.adjustmentForensics.cancelled = cancelled.length;
    }
    result.adjustmentForensics.adjReversalCount = await prisma.timberStockMovement.count({ where: { type: 'ADJ', referenceType: 'REVERSAL' } });

    const stocks = await prisma.timberStock.findMany({ include: { movements: true } });
    for (const stock of stocks) {
        if (stock.currentPcs < 0) result.negativeStock++;
        let ledgerPcs = stock.openingPcs || 0;
        let ledgerM3 = stock.openingVolumeM3 || 0;
        let hasMovements = stock.movements.length > 0;
        
        for (const mov of stock.movements) {
            const dec = mov.type === 'OUT' || (mov.type === 'ADJ' && (mov.referenceType === 'ADJUSTMENT_OUT' || mov.referenceType === 'REVERSAL'));
            const sign = dec ? -1 : 1;
            ledgerPcs += (mov.quantityPcs * sign);
            ledgerM3 += (mov.volumeM3 * sign);
        }
        
        let status = 'MATCH';
        if (!hasMovements) status = 'NO_LEDGER_HISTORY';
        else if (ledgerPcs !== stock.currentPcs || Math.abs(ledgerM3 - stock.currentVolumeM3) > 0.001) status = 'MISMATCH';
        
        result.reconciliation.push({
            id: stock.id,
            stockPcs: stock.currentPcs,
            ledgerPcs,
            stockM3: stock.currentVolumeM3,
            ledgerM3,
            status
        });
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
