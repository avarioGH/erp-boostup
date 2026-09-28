const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 15000
};

conn.on('ready', () => {
  const tsCode = `
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

async function run() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const companyId = '6a987114770e0a54883770b1';

  const report: any = {
    company: { name: 'Boostup ERP', id: companyId },
    masterData: { species: 0, grades: 0, warehouses: 0, locations: 0 },
    timberVariant: { total: 0, records: [] },
    timberStock: { totalRecords: 0, totalPcs: 0, totalM3: 0, warehouses: [], variants: [], batches: [] },
    timberStockMovement: { total: 0, totalIn: 0, totalOut: 0, totalAdj: 0, totalPcs: 0, totalM3: 0 },
    stockLedgerReconciliation: { status: 'MATCH', details: '' },
    batchAudit: {},
    reservationAudit: { healthy: 0, overReserved: 0, orphan: 0, total: 0 },
    salesOrderAudit: { count: 0 },
    shipmentAudit: { count: 0 },
    purchaseAudit: { count: 0 },
    productionAudit: { rawLog: 0, trimmedLog: 0, inputLog: 0, output: 0 },
    transferAudit: { count: 0 },
    adjustmentAudit: { count: 0 },
    opnameAudit: { count: 0 },
    legacySeparation: {
      WarehouseStock: 0,
      StockMovement: 0,
      InventoryTransaction: 0,
      Status: 'LEGACY_DATA_OUTSIDE_CURRENT_INVENTORY_ENGINE'
    },
    baselineClassification: 'UNDETERMINED',
    databaseMutations: 0
  };

  try {
    const fetchAll = async (name: string) => {
      try {
        const res: any = await prisma.$runCommandRaw({ find: name });
        if (!res || !res.cursor || !res.cursor.firstBatch) return [];
        return res.cursor.firstBatch.filter((r: any) => {
           const cid = r.companyId?.$oid || r.companyId || r.company_id?.$oid || r.company_id || r.tenant_id;
           return cid === companyId;
        });
      } catch (e) { return []; }
    };

    const variants = await fetchAll('TimberVariant');
    report.timberVariant.total = variants.length;

    const stocks = await fetchAll('TimberStock');
    report.timberStock.totalRecords = stocks.length;
    let wsSet = new Set();
    let varSet = new Set();
    let bSet = new Set();
    stocks.forEach((s: any) => {
       const pcs = s.currentPcs || s.pcs || 0;
       const m3 = s.currentM3 || s.m3 || s.volume || 0;
       report.timberStock.totalPcs += pcs;
       report.timberStock.totalM3 += m3;
       if (s.warehouseId || s.locationId) wsSet.add(s.warehouseId?.$oid || s.warehouseId || s.locationId?.$oid || s.locationId);
       if (s.timberVariantId) varSet.add(s.timberVariantId?.$oid || s.timberVariantId);
       bSet.add(s.batch || 'UNKNOWN');
    });
    report.timberStock.warehouses = Array.from(wsSet);
    report.timberStock.variants = Array.from(varSet);
    report.timberStock.batches = Array.from(bSet);

    const movs = await fetchAll('TimberStockMovement');
    report.timberStockMovement.total = movs.length;
    movs.forEach((m: any) => {
       const pcs = m.pcs || 0;
       const m3 = m.m3 || m.volume || 0;
       report.timberStockMovement.totalPcs += pcs;
       report.timberStockMovement.totalM3 += m3;
       
       const dir = (m.direction || m.type || '').toUpperCase();
       if (dir === 'IN') report.timberStockMovement.totalIn += pcs;
       else if (dir === 'OUT') report.timberStockMovement.totalOut += pcs;
       else if (dir === 'ADJ' || dir === 'ADJUSTMENT') report.timberStockMovement.totalAdj += pcs;
    });

    if (report.timberStockMovement.total === 0 && report.timberStock.totalRecords === 0) {
      report.stockLedgerReconciliation.status = 'MATCH';
    } else {
      report.stockLedgerReconciliation.status = 'INSUFFICIENT_DATA';
    }

    const r1 = await fetchAll('Reservation');
    const r2 = await fetchAll('TimberStockReservation');
    report.reservationAudit.total = r1.length + r2.length;

    const so = await fetchAll('SalesOrder');
    report.salesOrderAudit.count = so.length;
    
    const sh1 = await fetchAll('TimberShipment');
    const sh2 = await fetchAll('Shipment');
    report.shipmentAudit.count = sh1.length + sh2.length;
    
    const p1 = await fetchAll('Purchase');
    const p2 = await fetchAll('TimberPurchase');
    report.purchaseAudit.count = p1.length + p2.length;
    
    const rl = await fetchAll('RawLog');
    report.productionAudit.rawLog = rl.length;
    
    const tl = await fetchAll('TrimmedLog');
    report.productionAudit.trimmedLog = tl.length;
    
    const il = await fetchAll('InputLog');
    report.productionAudit.inputLog = il.length;
    
    const so1 = await fetchAll('SawnTimberOutput');
    const so2 = await fetchAll('Production');
    report.productionAudit.output = so1.length + so2.length;

    const tr = await fetchAll('StockTransfer');
    report.transferAudit.count = tr.length;
    
    const ad = await fetchAll('StockAdjustment');
    report.adjustmentAudit.count = ad.length;
    
    const op1 = await fetchAll('StockOpname');
    const op2 = await fetchAll('TimberStockOpname');
    report.opnameAudit.count = op1.length + op2.length;

    const sp1 = await fetchAll('TimberSpecies');
    const sp2 = await fetchAll('Species');
    report.masterData.species = sp1.length + sp2.length;
    
    const gr1 = await fetchAll('TimberGrade');
    const gr2 = await fetchAll('Grade');
    report.masterData.grades = gr1.length + gr2.length;
    
    const wh = await fetchAll('Warehouse');
    report.masterData.warehouses = wh.length;
    
    const loc = await fetchAll('Location');
    report.masterData.locations = loc.length;

    const lws = await fetchAll('WarehouseStock');
    report.legacySeparation.WarehouseStock = lws.length;
    
    const lsm = await fetchAll('StockMovement');
    report.legacySeparation.StockMovement = lsm.length;
    
    const lit = await fetchAll('InventoryTransaction');
    report.legacySeparation.InventoryTransaction = lit.length;

    const workflowsActive = 
      report.salesOrderAudit.count > 0 || 
      report.productionAudit.rawLog > 0 || 
      report.purchaseAudit.count > 0 ||
      report.shipmentAudit.count > 0 ||
      report.productionAudit.inputLog > 0 ||
      report.productionAudit.output > 0;

    if (report.timberStock.totalRecords === 0 && report.timberStockMovement.total === 0 && report.timberVariant.total === 0) {
      if (workflowsActive) {
        report.baselineClassification = 'CLEAN_BASELINE_WITH_NONINVENTORY_DATA';
      } else {
        report.baselineClassification = 'CLEAN_EMPTY_BASELINE';
      }
    } else if (report.timberStock.totalRecords > 0) {
      report.baselineClassification = 'CURRENT_INVENTORY_EXISTS';
    } else {
      report.baselineClassification = 'CURRENT_INVENTORY_INCONSISTENT';
    }

    const filename = \`phase_46_1_current_erp_clean_baseline_\${Date.now()}.json\`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log("JSON_FILE=" + filename);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
`;

  const cmd = `
    cd /root/erp-boostup || exit 1
    cat << 'EOF' > backend/src/clean-baseline-forensics.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/clean-baseline-forensics.ts > output_baseline.txt
    
    FILE=$(grep "JSON_FILE=" output_baseline.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
      echo "SIZE: $(wc -c < $FILE | awk '{print $1}')"
      cat $FILE
    else
      echo "FAILED TO GENERATE"
      cat output_baseline.txt
    fi
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', data => {
      process.stdout.write(data.toString());
    }).stderr.on('data', data => {
      process.stderr.write(data.toString());
    });
  });
}).connect(config);
