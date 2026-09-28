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
  const dbUrl = process.env.DATABASE_URL || '';
  let redactedUrl = 'NOT_SET';
  let dbName = 'UNKNOWN';
  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      parsed.password = 'REDACTED';
      parsed.username = 'REDACTED';
      redactedUrl = parsed.toString();
      dbName = parsed.pathname.replace('/', '') || 'test';
    } catch (e) {
      redactedUrl = 'INVALID_URL_FORMAT';
    }
  }

  const prisma = new PrismaClient();
  await prisma.$connect();
  const companyId = '6a987114770e0a54883770b1';

  const report: any = {
    databaseIdentity: {
      url: redactedUrl,
      logicalDatabase: dbName,
      status: 'CONNECTED'
    },
    prismaMapping: {
      "TimberStock": "TimberStock",
      "TimberStockMovement": "TimberStockMovement",
      "TimberVariant": "TimberVariant",
      "Warehouse": "Warehouse",
      "Company": "Company"
    },
    currentDatabaseCollections: {},
    databaseList: [],
    candidateDatabases: [],
    candidateCollections: {},
    companyCheck: {},
    warehouseCheck: {},
    inventoryPresence: {},
    diagnosis: 'UNDETERMINED'
  };

  try {
    // 1. Check listDatabases
    try {
      const dbsRes = await prisma.$runCommandRaw({ listDatabases: 1 });
      if (dbsRes && Array.isArray((dbsRes as any).databases)) {
        report.databaseList = (dbsRes as any).databases.map((d: any) => d.name);
        report.candidateDatabases = report.databaseList.filter((n: string) => 
          n.toLowerCase().includes('erp') || n.toLowerCase().includes('boostup') || 
          n.toLowerCase().includes('invent') || n.toLowerCase().includes('prod') || n.toLowerCase().includes('timber')
        );
      }
    } catch (e: any) {
      report.databaseList = ['DATABASE_LIST_PERMISSION_DENIED'];
    }

    // 2. Check collections
    let colls: any[] = [];
    try {
      const collRes = await prisma.$runCommandRaw({ listCollections: 1 });
      if (collRes && (collRes as any).cursor && Array.isArray((collRes as any).cursor.firstBatch)) {
        colls = (collRes as any).cursor.firstBatch.map((c: any) => c.name);
        for (const c of colls) {
          report.currentDatabaseCollections[c] = -1; // count pending
        }
      }
    } catch (e) {
      report.currentDatabaseCollections = { "error": "Could not list collections" };
    }

    // 3. Count collections and find candidates
    const suspiciousNames = ['stock', 'timber', 'invent', 'variant', 'warehouse', 'ledger', 'movement'];
    for (const c of colls) {
      try {
        const countRes = await prisma.$runCommandRaw({ count: c });
        const count = countRes ? (countRes as any).n : 0;
        report.currentDatabaseCollections[c] = count;
        
        const cLower = c.toLowerCase();
        if (suspiciousNames.some(s => cLower.includes(s))) {
          report.candidateCollections[c] = count;
        }
      } catch (e) {
        // ignore count errors
      }
    }

    // 4. Inspect specific legacy or alternate collections
    report.inventoryPresence = {
      TimberStock: report.currentDatabaseCollections['TimberStock'] || 0,
      TimberVariant: report.currentDatabaseCollections['TimberVariant'] || 0,
      TimberStockMovement: report.currentDatabaseCollections['TimberStockMovement'] || 0,
      candidateLegacyCollections: report.candidateCollections
    };

    // 5. Company / Warehouse Check
    try {
      const comp = await prisma.company.findUnique({ where: { id: companyId } });
      report.companyCheck = comp ? { id: comp.id, name: comp.name } : { status: 'NOT_FOUND' };
      
      const whs = await prisma.warehouse.findMany({ where: { company_id: companyId }, select: { id: true, name: true } });
      report.warehouseCheck = {
        total: whs.length,
        names: whs.map(w => w.name)
      };
    } catch (e) {
      // ignore
    }

    // 6. Diagnosis logic
    const stockCollCount = report.currentDatabaseCollections['TimberStock'] || 0;
    
    // Check if there is an alternative collection with data (like "stocks", "inventories")
    let hasAltInventory = false;
    for (const [k, v] of Object.entries(report.candidateCollections)) {
      if (k !== 'TimberStock' && k !== 'TimberStockMovement' && k !== 'TimberVariant' && k !== 'Warehouse') {
         if ((v as number) > 0 && (k.toLowerCase().includes('stock') || k.toLowerCase().includes('invent'))) {
            hasAltInventory = true;
         }
      }
    }

    if (stockCollCount === 0) {
      if (hasAltInventory) {
        report.diagnosis = 'INVENTORY_IN_LEGACY_COLLECTION';
      } else if (report.candidateDatabases.length > 1) {
        report.diagnosis = 'INVENTORY_IN_DIFFERENT_DATABASE';
      } else {
        report.diagnosis = 'CORRECT_DATABASE_INVENTORY_GENUINELY_EMPTY';
      }
    } else {
      // Stock collection has data, but our previous audit returned 0.
      report.diagnosis = 'PRISMA_COLLECTION_MAPPING_MISMATCH'; // Or relation issue
    }

    const filename = \`phase_45_9f_database_identity_\${Date.now()}.json\`;
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
    cat << 'EOF' > backend/src/database-identity.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/database-identity.ts > output_forensics.txt
    
    FILE=$(grep "JSON_FILE=" output_forensics.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
      echo "SIZE: $(wc -c < $FILE | awk '{print $1}')"
      cat $FILE
    else
      echo "FAILED TO GENERATE"
      cat output_forensics.txt
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
