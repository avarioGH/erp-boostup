const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const tsCode = `
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_MASTER_DATA = {
  warehouses: [
    { code: 'WH-MAIN', name: 'Gudang Utama' }
  ],
  locations: [
    { warehouseCode: 'WH-MAIN', code: 'LOC-IN', name: 'Area Penerimaan', isActive: true },
    { warehouseCode: 'WH-MAIN', code: 'LOC-OUT', name: 'Area Pengiriman', isActive: true }
  ],
  species: [
    { code: 'MERANTI', name: 'Meranti', isActive: true },
    { code: 'ULIN', name: 'Ulin', isActive: true }
  ],
  grades: [
    { code: 'A', name: 'Grade A', isActive: true },
    { code: 'B', name: 'Grade B', isActive: true },
    { code: 'LKL', name: 'Lokal', isActive: true }
  ],
  sources: [
    { code: 'SUP-01', name: 'Supplier Kalteng', isActive: true, type: 'SUPPLIER' }
  ]
};

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'kayu@boostup.id' } });
  if (!user || !user.company_id) {
    console.error("Target user/company not found!");
    process.exit(1);
  }
  const companyId = user.company_id as string;
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  console.log(\`=== PRE-SEED COUNTS FOR \${company?.name} ===\`);
  const preWarehouse = await prisma.warehouse.count({ where: { company_id: companyId } });
  const preSpecies = await prisma.timberSpecies.count({ where: { company_id: companyId } });
  const preVariant = await prisma.timberVariant.count({ where: { company_id: companyId } });
  console.log({ preWarehouse, preSpecies, preVariant });

  if (preVariant > 0) {
    console.error("Variants already exist. Stop.");
    process.exit(1);
  }

  const results = {
    created: { Warehouse: 0, Location: 0, TimberSpecies: 0, TimberGrade: 0, TimberSource: 0 },
    reused: { Warehouse: 0, Location: 0, TimberSpecies: 0, TimberGrade: 0, TimberSource: 0 }
  };

  // Seed Warehouses
  const warehouseMap = new Map();
  for (const w of INITIAL_MASTER_DATA.warehouses) {
    let rec = await prisma.warehouse.findFirst({ where: { company_id: companyId, code: w.code } });
    if (!rec) {
      rec = await prisma.warehouse.create({ data: { company_id: companyId, code: w.code, name: w.name } });
      results.created.Warehouse++;
    } else {
      results.reused.Warehouse++;
    }
    warehouseMap.set(w.code, rec.id);
  }

  // Seed Locations
  for (const l of INITIAL_MASTER_DATA.locations) {
    const wId = warehouseMap.get(l.warehouseCode);
    if (!wId) continue;
    let rec = await prisma.location.findFirst({ where: { warehouseId: wId, code: l.code } });
    if (!rec) {
      rec = await prisma.location.create({ data: { warehouseId: wId, code: l.code, name: l.name, isActive: l.isActive } });
      results.created.Location++;
    } else {
      results.reused.Location++;
    }
  }

  // Seed Species
  for (const s of INITIAL_MASTER_DATA.species) {
    let rec = await prisma.timberSpecies.findFirst({ where: { company_id: companyId, code: s.code } });
    if (!rec) {
      rec = await prisma.timberSpecies.create({ data: { company_id: companyId, code: s.code, name: s.name, isActive: s.isActive } });
      results.created.TimberSpecies++;
    } else {
      results.reused.TimberSpecies++;
    }
  }

  // Seed Grades
  for (const g of INITIAL_MASTER_DATA.grades) {
    let rec = await prisma.timberGrade.findFirst({ where: { company_id: companyId, code: g.code } });
    if (!rec) {
      rec = await prisma.timberGrade.create({ data: { company_id: companyId, code: g.code, name: g.name, isActive: g.isActive } });
      results.created.TimberGrade++;
    } else {
      results.reused.TimberGrade++;
    }
  }

  // Seed Sources
  for (const s of INITIAL_MASTER_DATA.sources) {
    let rec = await prisma.timberSource.findFirst({ where: { company_id: companyId, code: s.code } });
    if (!rec) {
      rec = await prisma.timberSource.create({ data: { company_id: companyId, code: s.code, name: s.name, isActive: s.isActive, type: s.type } });
      results.created.TimberSource++;
    } else {
      results.reused.TimberSource++;
    }
  }

  console.log("=== SEED RESULTS ===");
  console.log(JSON.stringify(results, null, 2));

  console.log("=== POST-SEED COUNTS ===");
  const postWarehouse = await prisma.warehouse.count({ where: { company_id: companyId } });
  const postLocation = await prisma.location.count({ where: { warehouse: { company_id: companyId } } });
  const postSpecies = await prisma.timberSpecies.count({ where: { company_id: companyId } });
  const postGrade = await prisma.timberGrade.count({ where: { company_id: companyId } });
  const postSource = await prisma.timberSource.count({ where: { company_id: companyId } });
  const postVariant = await prisma.timberVariant.count({ where: { company_id: companyId } });
  console.log({ postWarehouse, postLocation, postSpecies, postGrade, postSource, postVariant });

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > run-phase477-seed2.ts
${tsCode}
EOF
    npx ts-node run-phase477-seed2.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
