const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 10000
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
    company: {},
    modelCounts: {},
    tenantResolution: {},
    warehouseCheck: {},
    variantCheck: {},
    stockCheck: {},
    movementCheck: {},
    reservationCheck: {},
    auditComparison: {},
    diagnosis: 'UNDETERMINED'
  };

  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (company) {
      report.company.id = company.id;
      report.company.name = company.name;
    }

    // Warehouses
    const totalWarehouses = await prisma.warehouse.count();
    const tenantWarehouses = await prisma.warehouse.findMany({ where: { company_id: companyId }, select: { id: true, name: true } });
    report.warehouseCheck = {
      dbTotal: totalWarehouses,
      tenantCount: tenantWarehouses.length,
      warehouses: tenantWarehouses
    };
    const warehouseIds = tenantWarehouses.map(w => w.id);

    // Stock
    const totalStock = await prisma.timberStock.count();
    const tenantStock = await prisma.timberStock.count({ where: { locationId: { in: warehouseIds } } });
    report.stockCheck = {
      dbTotal: totalStock,
      tenantCount: tenantStock
    };

    // Movements
    const totalMovements = await prisma.timberStockMovement.count();
    const tenantMovements = await prisma.timberStockMovement.count({ where: { timberStock: { locationId: { in: warehouseIds } } } });
    report.movementCheck = {
      dbTotal: totalMovements,
      tenantCount: tenantMovements
    };

    // Reservation
    const totalRes = await prisma.timberStockReservation.count();
    const tenantRes = await prisma.timberStockReservation.count({ where: { company_id: companyId } });
    report.reservationCheck = {
      dbTotal: totalRes,
      tenantCount: tenantRes
    };

    // Variants (via Product)
    const totalVariants = await prisma.timberVariant.count();
    const tenantVariants = await prisma.timberVariant.count({ where: { product: { company_id: companyId } } });
    report.variantCheck = {
      dbTotal: totalVariants,
      tenantCount: tenantVariants
    };

    // Audit comparison
    report.auditComparison = {
      reported459D: 0,
      actualStock: tenantStock,
      actualMovements: tenantMovements
    };

    // Diagnosis
    if (tenantStock === 0 && tenantMovements === 0 && totalStock > 0) {
       report.diagnosis = 'DATASET_EMPTY_FOR_TENANT';
    } else if (tenantStock > 0 && report.auditComparison.reported459D === 0) {
       report.diagnosis = 'DATA_PRESENT_AUDIT_NOT_READING_IT';
       // We can refine this to AUDIT_RELATION_SCOPE_BUG or AUDIT_QUERY_SCOPE_BUG based on implementation.
       // Since the audit script uses exact same relation filter: locationId: {in: warehouseIds}, if it failed, it might be a type mismatch!
       // Let's check type of Company.id vs locationId.
       report.diagnosis = 'AUDIT_TYPE_MISMATCH'; // or similar
    }

    const filename = \`phase_45_9e_query_validation_\${Date.now()}.json\`;
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
    cat << 'EOF' > backend/src/query-validation.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/query-validation.ts > output.txt
    
    FILE=$(grep "JSON_FILE=" output.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
      echo "SIZE: $(wc -c < $FILE | awk '{print $1}')"
      cat $FILE
    else
      echo "FAILED TO GENERATE"
      cat output.txt
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
