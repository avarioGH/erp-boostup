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
import * as xlsx from 'xlsx';

async function run() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const targetProductId = '6a9923b00da794808a19fe1e';

  const report: any = {
    repositoryFiles: [],
    spreadsheetMatches: [],
    productReferences: [],
    importCodeAnalysis: {
      createsWarehouseStock: false,
      createsStockMovement: false,
      createsInventoryTransaction: false,
      canCreateOpeningBalanceWithoutMovement: false,
      warehouseResolution: 'UNKNOWN',
      productResolution: 'UNKNOWN',
      acceptedColumns: []
    },
    knownExcelAuditFiles: [],
    externalReferences: [],
    reconstruction2005: {
      found1950: false,
      found50: false,
      found5: false,
      found2005: false,
      exactSourceFound: false
    },
    sourceConfidence: 'NONE',
    diagnosis: 'UNDETERMINED'
  };

  try {
    try {
      const pRes: any = await prisma.$runCommandRaw({ find: 'Product', filter: { _id: { $oid: targetProductId } } });
      if (pRes && pRes.cursor && pRes.cursor.firstBatch && pRes.cursor.firstBatch.length > 0) {
        report.productReferences = pRes.cursor.firstBatch;
      }
    } catch(e) {}

    try {
      const code = fs.readFileSync('/root/erp-boostup/backend/src/inventory/import/import.service.ts', 'utf8');
      report.importCodeAnalysis.createsWarehouseStock = code.includes('WarehouseStock') && code.includes('create');
      report.importCodeAnalysis.createsStockMovement = code.includes('StockMovement') && code.includes('create');
      report.importCodeAnalysis.createsInventoryTransaction = code.includes('InventoryTransaction') && code.includes('create');
      report.importCodeAnalysis.canCreateOpeningBalanceWithoutMovement = report.importCodeAnalysis.createsWarehouseStock && !report.importCodeAnalysis.createsStockMovement;
      
      if (code.includes('warehouse_id: ') || code.includes('warehouse_id =')) report.importCodeAnalysis.warehouseResolution = 'ID';
      else if (code.includes('warehouse.name')) report.importCodeAnalysis.warehouseResolution = 'NAME';
      
      if (code.includes('product_id')) report.importCodeAnalysis.productResolution = 'ID';
      else if (code.includes('product.sku')) report.importCodeAnalysis.productResolution = 'SKU';
      
      const cols = code.match(/['"\`]sku['"\`]|['"\`]warehouse['"\`]|['"\`]qty['"\`]|['"\`]stock['"\`]|['"\`]quantity['"\`]/gi);
      if (cols) report.importCodeAnalysis.acceptedColumns = Array.from(new Set(cols)).map(c => c.replace(/['"\`]/g, ''));
    } catch(e) {
      report.importCodeAnalysis.error = 'Could not read import.service.ts';
    }

    let files: string[] = [];
    try {
      // simpler find
      const cmd = 'find /root/erp-boostup -type f -name "*.xlsx" -not -path "*/node_modules/*" -not -path "*/.git/*"';
      files = execSync(cmd).toString().split('\\n').filter(x => x);
      for(let f of files) {
        const stat = fs.statSync(f);
        report.repositoryFiles.push({ filename: f, size: stat.size, modified: stat.mtime });
        if (f.includes('DATA MUAT') || f.includes('LOG LIST') || f.includes('Oktober 2025') || f.includes('PROD SWM ULIN AWIE')) {
          report.knownExcelAuditFiles.push(f);
        }
      }
    } catch(e) {}

    let exactFound = false;
    for(const f of files) {
      try {
        const wb = xlsx.readFile(f);
        for(const sheetName of wb.SheetNames) {
          const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null });
          const strData = JSON.stringify(data).toLowerCase();
          
          let has1950 = strData.includes('1950');
          let has50 = strData.includes('50');
          let has5 = strData.includes(':5,') || strData.includes(' 5 ') || strData.includes('"5"');
          let has2005 = strData.includes('2005');
          let hasGdng = strData.includes('gdng01');
          let hasSby = strData.includes('surabaya');
          let hasJkt = strData.includes('jakarta');
          let hasPid = strData.includes(targetProductId.toLowerCase());

          if (has1950 || has50 || has5 || has2005 || hasGdng || hasSby || hasJkt || hasPid) {
             const matchRec: any = { filename: f, sheet: sheetName, matchType: [] };
             if (has1950) matchRec.matchType.push('1950');
             if (has50) matchRec.matchType.push('50');
             if (has5) matchRec.matchType.push('5');
             if (has2005) matchRec.matchType.push('2005');
             if (hasGdng) matchRec.matchType.push('GDNG01');
             if (hasSby) matchRec.matchType.push('surabaya');
             if (hasJkt) matchRec.matchType.push('jakarta');
             if (hasPid) matchRec.matchType.push(targetProductId);
             
             const sampleRows = data.filter((row: any) => {
                const rStr = JSON.stringify(row).toLowerCase();
                return rStr.includes('1950') || rStr.includes('surabaya') || rStr.includes(targetProductId.toLowerCase());
             });
             
             if (sampleRows.length > 0) {
                matchRec.sampleRows = sampleRows.slice(0, 3);
             }
             report.spreadsheetMatches.push(matchRec);

             if (has1950) report.reconstruction2005.found1950 = true;
             if (has50) report.reconstruction2005.found50 = true;
             if (has5) report.reconstruction2005.found5 = true;
             if (has2005) report.reconstruction2005.found2005 = true;

             if (has1950 && has50 && hasGdng && hasSby && hasJkt) {
               exactFound = true;
               report.reconstruction2005.exactSourceFound = true;
             }
          }
        }
      } catch(e) {}
    }

    if (exactFound) {
      report.sourceConfidence = 'HIGH';
      report.diagnosis = 'EXACT_HISTORICAL_SOURCE_FOUND';
    } else if (report.reconstruction2005.found1950 && report.reconstruction2005.found50) {
      report.sourceConfidence = 'MEDIUM';
      report.diagnosis = 'PARTIAL_SOURCE_FOUND';
    } else if (files.length === 0) {
      report.sourceConfidence = 'NONE';
      report.diagnosis = 'NO_HISTORICAL_SOURCE_FOUND';
      if (report.importCodeAnalysis.createsWarehouseStock) {
        report.diagnosis = 'IMPORT_MECHANISM_IDENTIFIED_BUT_SOURCE_MISSING';
      }
    } else {
      report.sourceConfidence = 'LOW';
      report.diagnosis = 'IMPORT_MECHANISM_IDENTIFIED_BUT_SOURCE_MISSING';
    }

    const filename = \`phase_45_12_historical_import_source_\${Date.now()}.json\`;
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
    cat << 'EOF' > backend/src/historical-import-forensics.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/historical-import-forensics.ts > output_forensics_12.txt
    
    FILE=$(grep "JSON_FILE=" output_forensics_12.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
      echo "SIZE: $(wc -c < $FILE | awk '{print $1}')"
      cat $FILE
    else
      echo "FAILED TO GENERATE"
      cat output_forensics_12.txt
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
