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
    warehouseStock: [],
    legacyProducts: [],
    currentMasterData: {},
    variantMapping: [],
    quantityAnalysis: {
      current_stock_total: 0,
      available_stock_total: 0,
      movement_derived_total: 0,
      unit: 'UNIT_UNDETERMINED'
    },
    movementAnalysis: { data: [] },
    transactionAnalysis: { data: [] },
    warehouseMapping: [],
    batchAnalysis: { status: 'LEGACY_BATCH_UNAVAILABLE', evidence: [] },
    traceability: { status: 'NOT_TRACEABLE' },
    applicationCodeEvidence: {},
    migrationReadiness: 'DO_NOT_MIGRATE_YET',
    legacyReconciliation: 'INSUFFICIENT_DATA'
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
    const products = await fetchColl('Product');
    const warehouses = await fetchColl('Warehouse');

    report.warehouseStock = wsData;
    report.movementAnalysis.data = smData;
    report.transactionAnalysis.data = itData;
    
    // Product Analysis
    const productIds = new Set(wsData.map((w: any) => w.product_id?.$oid || w.product_id || w.productId));
    const matchedProducts = products.filter((p: any) => productIds.has(p._id?.$oid || p._id || p.id));
    report.legacyProducts = matchedProducts;

    // Unit & Variant Mapping
    // In legacy, Product often has a unit or we can guess from SKU.
    let unit = 'UNIT_UNDETERMINED';
    let allMatchesExact = true;

    matchedProducts.forEach((p: any) => {
       const u = p.unit || p.uom || p.measure_unit;
       if (u) unit = u.toString().toUpperCase();

       // Variant Mapping logic: Does it have thickness, width, length, species, grade?
       const name = (p.name || '').toLowerCase();
       const sku = p.sku || p.code || p.product_code || '';
       
       let mappingStatus = 'INSUFFICIENT_VARIANT_DATA';
       if (name.includes('mm') || name.includes('cm') || sku.includes('x')) {
          mappingStatus = 'POTENTIAL_VARIANT_MATCH';
          allMatchesExact = false;
       } else {
          allMatchesExact = false;
       }
       
       report.variantMapping.push({
         legacyProductId: p._id?.$oid || p._id || p.id,
         sku: sku,
         name: p.name,
         category: p.category_id || p.category,
         unit: u,
         species: p.species || 'UNKNOWN',
         grade: p.grade || 'UNKNOWN',
         thickness: p.thickness || p.t || 0,
         width: p.width || p.w || 0,
         length: p.length || p.l || 0,
         proposedSku: sku,
         mappingStatus
       });
    });

    if (report.variantMapping.length > 0) {
      report.quantityAnalysis.unit = unit;
    }

    // Warehouse Mapping
    const whMap: any = {};
    warehouses.forEach((w: any) => {
       const id = w._id?.$oid || w._id || w.id;
       whMap[id] = w;
    });

    wsData.forEach((w: any) => {
       const wId = w.warehouse_id?.$oid || w.warehouse_id || w.warehouseId;
       const wh = whMap[wId];
       report.warehouseMapping.push({
         legacyWarehouseId: wId,
         currentWarehouseId: wId,
         name: wh ? wh.name : 'UNKNOWN',
         companyId: wh ? (wh.company_id?.$oid || wh.company_id || wh.companyId) : 'UNKNOWN'
       });
       
       report.quantityAnalysis.current_stock_total += (w.current_stock || 0);
       report.quantityAnalysis.available_stock_total += (w.available_stock || 0);
    });

    // StockMovement Analysis
    let derivedTotal = 0;
    smData.forEach((m: any) => {
       const qty = m.quantity || m.qty || 0;
       const dir = (m.movement_type || m.type || '').toUpperCase();
       
       if (dir === 'IN') derivedTotal += qty;
       else if (dir === 'OUT') derivedTotal -= qty;
       else if (dir === 'TRANSFER_IN') derivedTotal += qty;
       else if (dir === 'TRANSFER_OUT') derivedTotal -= qty;
    });
    report.quantityAnalysis.movement_derived_total = derivedTotal;

    // Reconciliation
    if (report.quantityAnalysis.current_stock_total === derivedTotal) {
       report.legacyReconciliation = 'MATCH';
    } else {
       report.legacyReconciliation = 'MISMATCH';
    }

    // Batch & Traceability
    let hasBatch = false;
    let hasTrace = false;
    wsData.forEach((w: any) => {
       if (w.batch || w.lot || w.log_number) hasBatch = true;
    });
    smData.forEach((m: any) => {
       if (m.batch || m.lot || m.reference_type === 'RAW_LOG' || m.reference_type === 'INPUT_LOG') {
         hasBatch = true;
       }
       if (m.reference_type === 'PRODUCTION' || m.source_id) hasTrace = true;
    });
    
    if (hasBatch) report.batchAnalysis.status = 'LEGACY_BATCH_AVAILABLE';
    if (hasTrace) report.traceability.status = 'TRACEABLE';

    // Application Evidence
    try {
      const grepCode = execSync("grep -rnw --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . -e 'WarehouseStock' -e 'current_stock' || true").toString();
      report.applicationCodeEvidence.raw = grepCode.split('\\n').filter(l => l.trim().length > 0).slice(0, 30);
    } catch(e) {}

    report.migrationReadiness = report.legacyProducts.length > 0 ? 'READY_FOR_MAPPING_DESIGN' : 'INSUFFICIENT_DATA';

    const filename = \`phase_45_10_legacy_product_mapping_\${Date.now()}.json\`;
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
    cat << 'EOF' > backend/src/legacy-product-mapping.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/legacy-product-mapping.ts > output_mapping_10.txt
    
    FILE=$(grep "JSON_FILE=" output_mapping_10.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
      echo "SIZE: $(wc -c < $FILE | awk '{print $1}')"
      cat $FILE
    else
      echo "FAILED TO GENERATE"
      cat output_mapping_10.txt
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
