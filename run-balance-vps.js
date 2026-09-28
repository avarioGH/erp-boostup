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
  const targetProductId = '6a9923b00da794808a19fe1e';

  const report: any = {
    stockRecords: [],
    productReferences: {},
    stockReferences: {},
    movementForensics: { data: [], totalDerived: 0 },
    transactionForensics: { data: [] },
    dateForensics: {},
    applicationCodeEvidence: {},
    migrationScripts: {},
    warehouseDistribution: {},
    currentErpTraceability: { status: 'NOT_TRACEABLE' },
    fileReferences: {},
    classification: 'INSUFFICIENT_EVIDENCE'
  };

  try {
    const fetchColl = async (name: string) => {
      try {
        const res: any = await prisma.$runCommandRaw({ find: name });
        return (res?.cursor?.firstBatch) || [];
      } catch (e) { return []; }
    };

    const wsData = await fetchColl('WarehouseStock');
    const smData = await fetchColl('StockMovement');
    const itData = await fetchColl('InventoryTransaction');

    let totalStock = 0;
    let earliestStockDate: Date | null = null;
    wsData.forEach((w: any) => {
      report.stockRecords.push(w);
      const whId = w.warehouse_id?.$oid || w.warehouse_id || 'UNKNOWN';
      const qty = w.current_stock || 0;
      totalStock += qty;
      report.warehouseDistribution[whId] = qty;
      
      const cDate = w.created_at?.$date ? new Date(w.created_at.$date) : (w.createdAt ? new Date(w.createdAt) : null);
      if (cDate && (!earliestStockDate || cDate < earliestStockDate)) {
        earliestStockDate = cDate;
      }
    });

    let derivedTotal = 0;
    let earliestMovDate: Date | null = null;
    smData.forEach((m: any) => {
      report.movementForensics.data.push(m);
      const qIn = m.qty_in || 0;
      const qOut = m.qty_out || 0;
      derivedTotal += qIn;
      derivedTotal -= qOut;
      
      const cDate = m.created_at?.$date ? new Date(m.created_at.$date) : (m.createdAt ? new Date(m.createdAt) : null);
      if (cDate && (!earliestMovDate || cDate < earliestMovDate)) {
        earliestMovDate = cDate;
      }
    });
    report.movementForensics.totalDerived = derivedTotal;

    let earliestTxDate: Date | null = null;
    itData.forEach((t: any) => {
      report.transactionForensics.data.push(t);
      const cDate = t.created_at?.$date ? new Date(t.created_at.$date) : (t.createdAt ? new Date(t.createdAt) : null);
      if (cDate && (!earliestTxDate || cDate < earliestTxDate)) {
        earliestTxDate = cDate;
      }
    });

    report.dateForensics = {
      WarehouseStock_earliest: earliestStockDate,
      StockMovement_earliest: earliestMovDate,
      InventoryTransaction_earliest: earliestTxDate
    };

    if (earliestStockDate && earliestMovDate && earliestStockDate < earliestMovDate) {
      if (derivedTotal === 0 && totalStock === 2005) {
        report.classification = 'OPENING_BALANCE_LIKELY';
      } else {
        report.classification = 'SNAPSHOT_PRECEDES_MOVEMENT_HISTORY';
      }
    } else {
      if (totalStock === 2005 && derivedTotal === 0) {
        report.classification = 'OPENING_BALANCE_LIKELY';
      }
    }

    const runGrep = (pattern: string) => {
      try {
        const res = execSync(\`grep -rnw --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . -e "\${pattern}" || true\`).toString();
        return res.split('\\n').filter(l => l.trim().length > 0).slice(0, 30);
      } catch (e) { return []; }
    };

    report.applicationCodeEvidence.product_references = runGrep(targetProductId);
    report.applicationCodeEvidence.number_2005 = runGrep("2005");
    report.migrationScripts.opening_balance = runGrep("opening balance");
    report.migrationScripts.initial_stock = runGrep("initial stock");
    report.fileReferences.csv_xls = runGrep(".csv").concat(runGrep(".xlsx")); 

    if (derivedTotal === 0 && totalStock === 2005) {
      const has2005InCode = report.applicationCodeEvidence.number_2005.some((l:string) => l.includes('WarehouseStock') || l.includes('seed') || l.includes('insert'));
      if (has2005InCode) {
        report.classification = 'OPENING_BALANCE_CONFIRMED';
      }
    }

    const filename = \`phase_45_11_opening_balance_forensic_\${Date.now()}.json\`;
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
    cat << 'EOF' > backend/src/legacy-balance-forensics.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/legacy-balance-forensics.ts > output_forensics_11.txt
    
    FILE=$(grep "JSON_FILE=" output_forensics_11.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
      echo "SIZE: $(wc -c < $FILE | awk '{print $1}')"
      cat $FILE
    else
      echo "FAILED TO GENERATE"
      cat output_forensics_11.txt
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
