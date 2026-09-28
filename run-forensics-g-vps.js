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
import { execSync } from 'child_process';

async function run() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const companyId = '6a987114770e0a54883770b1';

  const report: any = {
    database: { connected: true },
    warehouseStock: { count: 0, fields: [], data: [], totalQty: 0, totalM3: 0, totalPcs: 0 },
    stockMovement: { count: 0, fields: [], data: [], totalIn: 0, totalOut: 0 },
    inventoryTransaction: { count: 0, fields: [], data: [] },
    relationships: {},
    currentErpMapping: {},
    batchMapping: {},
    legacyReconciliation: {},
    tenantIsolation: {},
    applicationUsage: {},
    inventoryGap: {},
    diagnosis: 'UNDETERMINED'
  };

  try {
    // Read Unmapped Collections via runCommandRaw
    const fetchColl = async (name: string) => {
      try {
        const res: any = await prisma.$runCommandRaw({ find: name });
        if (res && res.cursor && res.cursor.firstBatch) {
          return res.cursor.firstBatch;
        }
      } catch (e) { }
      return [];
    };

    const wsData = await fetchColl('WarehouseStock');
    const smData = await fetchColl('StockMovement');
    const itData = await fetchColl('InventoryTransaction');

    // Process WarehouseStock
    report.warehouseStock.count = wsData.length;
    if (wsData.length > 0) {
      report.warehouseStock.fields = Object.keys(wsData[0]);
      report.warehouseStock.data = wsData;
      wsData.forEach(d => {
        report.warehouseStock.totalQty += (d.quantity || d.qty || 0);
        report.warehouseStock.totalM3 += (d.m3 || d.volume || 0);
        report.warehouseStock.totalPcs += (d.pcs || d.pieces || d.quantity || 0);
      });
    }

    // Process StockMovement
    report.stockMovement.count = smData.length;
    if (smData.length > 0) {
      report.stockMovement.fields = Object.keys(smData[0]);
      report.stockMovement.data = smData;
      smData.forEach(d => {
        const qty = d.quantity || d.qty || 0;
        const dir = (d.direction || d.type || '').toLowerCase();
        if (dir.includes('in')) report.stockMovement.totalIn += qty;
        else if (dir.includes('out')) report.stockMovement.totalOut += qty;
      });
    }

    // Process InventoryTransaction
    report.inventoryTransaction.count = itData.length;
    if (itData.length > 0) {
      report.inventoryTransaction.fields = Object.keys(itData[0]);
      report.inventoryTransaction.data = itData;
    }

    // Relationships & Mapping
    // Simple checks to see what references what
    // This is just a structure, we'll read the fields to understand
    const hasVariant = (d: any) => d.timberVariantId || d.variantId || d.product_id;
    const hasCompany = (d: any) => d.company_id || d.companyId || d.tenant_id;
    const hasBatch = (d: any) => d.batch || d.bundleNumber;

    let allWsBelong = true;
    wsData.forEach(d => { if (d.company_id !== companyId && d.companyId !== companyId) allWsBelong = false; });
    report.tenantIsolation.warehouseStockTenantMatch = allWsBelong;

    // Recon
    const derivedStock = report.stockMovement.totalIn - report.stockMovement.totalOut;
    report.legacyReconciliation.physical = report.warehouseStock.totalQty;
    report.legacyReconciliation.derived = derivedStock;
    report.legacyReconciliation.status = (report.warehouseStock.totalQty === derivedStock) ? 'LEGACY_STOCK_MATCH' : 'LEGACY_STOCK_MISMATCH';

    // Application usage
    try {
      const grepRes = execSync("grep -rnw --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . -e 'WarehouseStock' -e 'StockMovement' -e 'InventoryTransaction' || true").toString();
      report.applicationUsage.grep = grepRes.split('\\n').filter(l => l.trim().length > 0).slice(0, 50); // limit output
    } catch(e) {
      report.applicationUsage.grep = [];
    }
    
    // Inventory Gap
    report.inventoryGap.legacyCount = wsData.length + smData.length + itData.length;
    report.inventoryGap.currentTimberStock = 0;
    report.inventoryGap.currentTimberVariant = 0;
    report.inventoryGap.currentTimberStockMovement = 0;
    
    if (report.inventoryGap.legacyCount > 0 && report.applicationUsage.grep.length > 0) {
       report.inventoryGap.status = 'LEGACY_DATA_STILL_ACTIVE';
       report.diagnosis = 'LEGACY_INVENTORY_NOT_MIGRATED';
    } else {
       report.inventoryGap.status = 'LEGACY_DATA_STATUS_UNCLEAR';
       report.diagnosis = 'UNDETERMINED';
    }

    const filename = \`phase_45_9g_legacy_inventory_forensic_\${Date.now()}.json\`;
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
    cat << 'EOF' > backend/src/forensic-legacy.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/forensic-legacy.ts > output_forensics_g.txt
    
    FILE=$(grep "JSON_FILE=" output_forensics_g.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
      echo "SIZE: $(wc -c < $FILE | awk '{print $1}')"
      cat $FILE
    else
      echo "FAILED TO GENERATE"
      cat output_forensics_g.txt
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
