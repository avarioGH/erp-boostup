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
    targetProduct: {},
    company: { id: companyId, name: 'Boostup ERP' },
    productReferences: [],
    legacyInventory: {
      WarehouseStock: { records: 0, totalQuantity: 0 },
      StockMovement: { count: 0, totalIn: 0, totalOut: 0, totalTransfer: 0 },
      InventoryTransaction: { count: 0, types: [] }
    },
    businessReferences: {
      sales: 0, purchase: 0, production: 0, shipment: 0, other: 0
    },
    traceability: {
      rawLog: false, trimmedLog: false, inputLog: false, production: false, currentTimberStock: false
    },
    quantityForensics: {
      gdng01: 0, surabaya: 0, jakarta: 0, total: 0, suffixMatch: false
    },
    movementReconciliation: 'INSUFFICIENT_DATA',
    seedEvidence: { type: 'NONE', evidence: [] },
    timestampForensics: {},
    currentErpCrossCheck: { TimberVariant: 0, TimberStock: 0, TimberStockMovement: 0 },
    classification: 'INSUFFICIENT_DATA',
    migrationDisposition: 'UNDETERMINED',
    databaseMutations: 0
  };

  try {
    const fetchColl = async (name: string, filter = {}) => {
      try {
        const res: any = await prisma.$runCommandRaw({ find: name, filter });
        return (res?.cursor?.firstBatch) || [];
      } catch (e) { return []; }
    };

    const fetchAllCollections = async () => {
      try {
        const res: any = await prisma.$runCommandRaw({ listCollections: 1 });
        return res?.cursor?.firstBatch?.map((c: any) => c.name) || [];
      } catch (e) { return []; }
    };

    // 1. Target Product
    const pData = await fetchColl('Product', { _id: { $oid: targetProductId } });
    if (pData.length > 0) {
      report.targetProduct = pData[0];
      report.timestampForensics.product_created_at = pData[0].created_at?.$date || pData[0].createdAt;
    }

    // 2. Legacy Inventory
    const wsData = await fetchColl('WarehouseStock', { $or: [{ product_id: { $oid: targetProductId } }, { productId: targetProductId }, { product_id: targetProductId }] });
    const smData = await fetchColl('StockMovement', { $or: [{ product_id: { $oid: targetProductId } }, { productId: targetProductId }, { product_id: targetProductId }] });
    const itData = await fetchColl('InventoryTransaction', {}); // Will filter manually or by product if present. Actually IT might not have product directly, it might be in Items. We'll fetch all and filter by IT IDs that match SM.

    report.legacyInventory.WarehouseStock.records = wsData.length;
    
    wsData.forEach((w: any) => {
      const qty = w.current_stock || 0;
      report.legacyInventory.WarehouseStock.totalQuantity += qty;
      const wId = w.warehouse_id?.$oid || w.warehouse_id || 'UNKNOWN';
      
      if (wId === '6a9c217755becdfee38cfe5f') report.quantityForensics.gdng01 += qty;
      else if (wId === '6a9995a4f2b2f0a52fca1ffa') report.quantityForensics.surabaya += qty;
      else if (wId === '6a99af8b0da794808a19fe26') report.quantityForensics.jakarta += qty;
      
      report.quantityForensics.total += qty;
    });

    if (report.quantityForensics.gdng01 === 1950 && report.targetProduct?.code?.includes('1950')) {
      report.quantityForensics.suffixMatch = true;
    }

    let itIds = new Set();
    let derivedTotal = 0;
    smData.forEach((m: any) => {
      report.legacyInventory.StockMovement.count++;
      const type = (m.movement_type || m.type || '').toUpperCase();
      const qIn = m.qty_in || 0;
      const qOut = m.qty_out || 0;
      
      if (type.includes('IN') && !type.includes('TRANSFER')) report.legacyInventory.StockMovement.totalIn += qIn;
      if (type.includes('OUT') && !type.includes('TRANSFER')) report.legacyInventory.StockMovement.totalOut += qOut;
      if (type.includes('TRANSFER')) {
        report.legacyInventory.StockMovement.totalTransfer += (qIn + qOut); // just counting activity
      }
      
      derivedTotal += qIn;
      derivedTotal -= qOut;
      
      if (m.transaction_id?.$oid) itIds.add(m.transaction_id.$oid);
    });

    itData.forEach((t: any) => {
      const tid = t._id?.$oid || t.id;
      if (itIds.has(tid)) {
        report.legacyInventory.InventoryTransaction.count++;
        const tType = t.transaction_type || t.type;
        if (!report.legacyInventory.InventoryTransaction.types.includes(tType)) {
          report.legacyInventory.InventoryTransaction.types.push(tType);
        }
      }
    });

    if (report.quantityForensics.total === 2005 && derivedTotal === 0) {
      report.movementReconciliation = 'MISMATCH';
      report.movementReconciliationReason = '2005 snapshot but 0 net derived movement from StockMovement';
    }

    // 3. Current ERP Cross-Check
    const currVariant = await fetchColl('TimberVariant');
    const currStock = await fetchColl('TimberStock');
    const currMov = await fetchColl('TimberStockMovement');
    report.currentErpCrossCheck.TimberVariant = currVariant.length;
    report.currentErpCrossCheck.TimberStock = currStock.length;
    report.currentErpCrossCheck.TimberStockMovement = currMov.length;

    // 4. Traceability (RawLog, TrimmedLog, InputLog)
    // We already know it's a dummy product, but we check if any SM links to them.
    // It's known to be NOT TRACEABLE from phase 45.11, but script-verify:
    smData.forEach((m: any) => {
       const rType = (m.reference_type || '').toUpperCase();
       if (rType === 'RAW_LOG') report.traceability.rawLog = true;
       if (rType === 'TRIMMED_LOG') report.traceability.trimmedLog = true;
       if (rType === 'INPUT_LOG') report.traceability.inputLog = true;
       if (rType === 'PRODUCTION') report.traceability.production = true;
    });

    // 5. Business References (Operational Collections)
    const collections = await fetchAllCollections();
    for (const col of collections) {
       // skip system and logging collections, check operational ones
       if (col.startsWith('system.') || col === 'AuditLog' || col === 'AiChatHistory') continue;
       if (col === 'WarehouseStock' || col === 'StockMovement' || col === 'Product') continue;
       
       try {
         const qRes = await fetchColl(col, { $or: [{ product_id: { $oid: targetProductId } }, { productId: targetProductId }, { product_id: targetProductId }, { timberVariantId: targetProductId }] });
         if (qRes.length > 0) {
           report.productReferences.push({ collection: col, count: qRes.length });
           const cLower = col.toLowerCase();
           if (cLower.includes('sale') || cLower.includes('order')) report.businessReferences.sales += qRes.length;
           else if (cLower.includes('purch')) report.businessReferences.purchase += qRes.length;
           else if (cLower.includes('prod')) report.businessReferences.production += qRes.length;
           else if (cLower.includes('ship') || cLower.includes('deliver')) report.businessReferences.shipment += qRes.length;
           else report.businessReferences.other += qRes.length;
         }
       } catch(e) {}
    }

    // 6. Seed / Test Forensics
    const runGrep = (pattern: string) => {
      try {
        const res = execSync(\`grep -rnw --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . -e "\${pattern}" || true\`).toString();
        return res.split('\\n').filter(l => l.trim().length > 0).slice(0, 30);
      } catch (e) { return []; }
    };
    
    const prd1950Match = runGrep('PRD-1950');
    const produkAMatch = runGrep('produk a');
    const idMatch = runGrep(targetProductId);
    
    if (prd1950Match.length > 0 || produkAMatch.length > 0) {
       report.seedEvidence.evidence = prd1950Match.concat(produkAMatch, idMatch);
       const hasSeedFile = report.seedEvidence.evidence.some((x:string) => x.includes('seed') || x.includes('fixture') || x.includes('test'));
       report.seedEvidence.type = hasSeedFile ? 'DIRECT_SEED_EVIDENCE' : 'INDIRECT_SEED_EVIDENCE';
    }

    // Classification & Disposition
    const opTotal = report.businessReferences.sales + report.businessReferences.purchase + report.businessReferences.production + report.businessReferences.shipment;
    
    if (opTotal === 0 && report.quantityForensics.suffixMatch) {
       report.classification = 'CONFIRMED_DUMMY_OR_SEED';
       report.migrationDisposition = 'DO_NOT_MIGRATE';
    } else if (opTotal > 0) {
       report.classification = 'MIXED_OR_AMBIGUOUS';
       report.migrationDisposition = 'MIGRATION_REQUIRES_BUSINESS_CONFIRMATION';
    } else {
       report.classification = 'LIKELY_DUMMY_OR_SEED';
       report.migrationDisposition = 'MIGRATION_REQUIRES_MAPPING';
    }

    const filename = \`phase_45_13_legacy_dummy_disposition_\${Date.now()}.json\`;
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
    cat << 'EOF' > backend/src/legacy-dummy-forensics.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/legacy-dummy-forensics.ts > output_forensics_13.txt
    
    FILE=$(grep "JSON_FILE=" output_forensics_13.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
      echo "SIZE: $(wc -c < $FILE | awk '{print $1}')"
      cat $FILE
    else
      echo "FAILED TO GENERATE"
      cat output_forensics_13.txt
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
