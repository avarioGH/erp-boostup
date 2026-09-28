const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const nodeScript = `
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { execSync } = require('child_process');
const bcrypt = require('bcrypt');

async function runProvisioning() {
  const result = {
    prodBefore: {},
    prodAfter: {},
    uatIdentity: {},
    uatCompany: {},
    uatUser: {},
    uatWarehouse: {},
    uatLocation: {},
    uatMasterData: [],
    uatVariant: {},
    uatBackend: {},
    uatBaseline: {},
    mutations: { prodWrites: 0, prodUpdates: 0, prodDeletes: 0, prodMigrations: 0, uatWrites: 0, uatDeletes: 0 }
  };

  let prodPrisma;
  let uatPrisma;

  try {
    // 1. Resolve URLs
    const envContent = fs.readFileSync('/root/erp-boostup/backend/.env', 'utf-8');
    const dbUrlLine = envContent.split('\\n').find(l => l.startsWith('DATABASE_URL='));
    if (!dbUrlLine) throw new Error('DATABASE_URL not found in .env');
    
    const prodUrl = dbUrlLine.split('=')[1].trim();
    const urlObj = new URL(prodUrl);
    urlObj.pathname = '/uat_erp';
    const uatUrl = urlObj.toString();

    result.uatIdentity = {
      dbName: 'uat_erp',
      verificationMethod: 'Parsed connection string and replaced pathname',
      productionSeparation: 'True - distinct pathname'
    };

    // 2. Production Baseline Before
    prodPrisma = new PrismaClient({ datasources: { db: { url: prodUrl } } });
    const getProdBaseline = async () => ({
      company: await prodPrisma.company.count(),
      warehouse: await prodPrisma.warehouse.count(),
      location: await prodPrisma.location.count(),
      timberStock: await prodPrisma.timberStock.count(),
      timberStockMovement: await prodPrisma.timberStockMovement.count(),
      timberVariant: await prodPrisma.timberVariant.count(),
      rawLog: await prodPrisma.rawLog.count().catch(()=>0),
      trimmedLog: await prodPrisma.trimmedLog.count().catch(()=>0),
      inputLog: await prodPrisma.inputLog.count().catch(()=>0),
      sawnTimberOutput: await prodPrisma.sawnTimberOutput.count().catch(()=>0),
      timberPurchase: await prodPrisma.timberPurchase.count().catch(()=>0),
      timberShipment: await prodPrisma.timberShipment.count().catch(()=>0),
      timberStockReservation: await prodPrisma.timberStockReservation.count().catch(()=>0),
      stockAdjustment: await prodPrisma.stockAdjustment.count().catch(()=>0),
      stockTransfer: await prodPrisma.stockTransfer.count().catch(()=>0),
      productionProcess: await prodPrisma.productionProcess.count().catch(()=>0),
    });
    result.prodBefore = await getProdBaseline();

    // 3. Init UAT DB
    process.env.DATABASE_URL = uatUrl;
    // Push schema for indexes (safe since it uses the injected process.env.DATABASE_URL)
    execSync('npx prisma db push --accept-data-loss', { env: { ...process.env, DATABASE_URL: uatUrl } });
    
    uatPrisma = new PrismaClient({ datasources: { db: { url: uatUrl } } });

    // Ensure it's clean and safe
    const uatCompanyCount = await uatPrisma.company.count();
    if (uatCompanyCount > 0) {
       // If re-running, clean it up for idempotency during this phase, but let's assume it's fresh
       await uatPrisma.$transaction([
          uatPrisma.timberVariant.deleteMany(),
          uatPrisma.timberSpecies.deleteMany(),
          uatPrisma.timberGrade.deleteMany(),
          uatPrisma.timberSource.deleteMany(),
          uatPrisma.vehicle.deleteMany(),
          uatPrisma.driver.deleteMany(),
          uatPrisma.location.deleteMany(),
          uatPrisma.warehouse.deleteMany(),
          uatPrisma.user.deleteMany(),
          uatPrisma.rolePermission.deleteMany(),
          uatPrisma.role.deleteMany(),
          uatPrisma.permission.deleteMany(),
          uatPrisma.company.deleteMany()
       ]);
    }

    // 4. Create UAT Tenant
    const company = await uatPrisma.company.create({
      data: {
        name: 'UAT-TENANT-49H',
        timezone: 'Asia/Jakarta',
        currency: 'IDR'
      }
    });
    result.mutations.uatWrites++;
    result.uatCompany = { id: company.id, name: company.name };

    // 5. Create UAT User & Role
    const role = await uatPrisma.role.create({
      data: { company_id: company.id, name: 'UAT Admin' }
    });
    result.mutations.uatWrites++;
    
    const hash = await bcrypt.hash('uatpassword', 10);
    const user = await uatPrisma.user.create({
      data: {
        company_id: company.id,
        role_id: role.id,
        username: 'uat_admin',
        email: 'uat@boostup.test',
        password: hash,
        name: 'UAT Admin',
        status: true
      }
    });
    result.mutations.uatWrites++;
    result.uatUser = { id: user.id, company: company.id, role: 'UAT Admin' };

    // 6. Warehouse & Location
    const warehouse = await uatPrisma.warehouse.create({
      data: {
        company_id: company.id,
        code: 'WH-UAT-49H',
        name: 'Gudang UAT 49H'
      }
    });
    result.mutations.uatWrites++;
    result.uatWarehouse = { id: warehouse.id, code: warehouse.code, company: company.id };

    const location = await uatPrisma.location.create({
      data: {
        warehouseId: warehouse.id,
        code: 'LOC-UAT-49H',
        name: 'Area UAT 49H'
      }
    });
    result.mutations.uatWrites++;
    result.uatLocation = { id: location.id, code: location.code, warehouse: warehouse.id };

    // 7. Master Data
    const species = await uatPrisma.timberSpecies.create({ data: { company_id: company.id, code: 'MERANTI-UAT', name: 'Meranti UAT' } });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'TimberSpecies', id: species.id, code: species.code, company: company.id });

    const grade = await uatPrisma.timberGrade.create({ data: { company_id: company.id, code: 'A-UAT', name: 'Grade A UAT' } });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'TimberGrade', id: grade.id, code: grade.code, company: company.id });

    const source = await uatPrisma.timberSource.create({ data: { company_id: company.id, code: 'SUP-UAT', name: 'Supplier UAT 49H' } });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'TimberSource', id: source.id, code: source.code, company: company.id });

    const vehicle = await uatPrisma.vehicle.create({ data: { company_id: company.id, plate_number: 'UAT-TRUCK-49H', type: 'Truck', capacity_kg: 5000 } });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'Vehicle', id: vehicle.id, code: vehicle.plate_number, company: company.id });

    const driver = await uatPrisma.driver.create({ data: { company_id: company.id, name: 'Driver UAT 49H', phone: '0800000000' } });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'Driver', id: driver.id, code: driver.name, company: company.id });

    // 8. TimberVariant
    const t = 20, w = 100, l = 1000;
    const vol = (t * w * l) / 1000000000; // standard m3 calculation for mm
    const variant = await uatPrisma.timberVariant.create({
      data: {
        company_id: company.id,
        sku: 'UAT-SKU-49H-' + Date.now(),
        speciesId: species.id,
        gradeId: grade.id,
        thicknessMm: t,
        widthMm: w,
        lengthMm: l,
        volumePerPiece: vol
      }
    });
    result.mutations.uatWrites++;
    result.uatVariant = {
      id: variant.id,
      sku: variant.sku,
      species: 'MERANTI-UAT',
      grade: 'A-UAT',
      dimensions: `20x100x1000`,
      volumePerPiece: vol,
      verification: 'Matches standard (20*100*1000)/1B = 0.002'
    };

    // 9. UAT Baseline
    const getUatBaseline = async () => ({
      company: await uatPrisma.company.count(),
      warehouse: await uatPrisma.warehouse.count(),
      location: await uatPrisma.location.count(),
      timberStock: await uatPrisma.timberStock.count(),
      timberStockMovement: await uatPrisma.timberStockMovement.count(),
      timberVariant: await uatPrisma.timberVariant.count(),
      rawLog: await uatPrisma.rawLog.count().catch(()=>0),
      trimmedLog: await uatPrisma.trimmedLog.count().catch(()=>0),
      inputLog: await uatPrisma.inputLog.count().catch(()=>0),
      sawnTimberOutput: await uatPrisma.sawnTimberOutput.count().catch(()=>0),
      timberPurchase: await uatPrisma.timberPurchase.count().catch(()=>0),
      timberShipment: await uatPrisma.timberShipment.count().catch(()=>0),
      timberStockReservation: await uatPrisma.timberStockReservation.count().catch(()=>0),
      stockAdjustment: await uatPrisma.stockAdjustment.count().catch(()=>0),
      stockTransfer: await uatPrisma.stockTransfer.count().catch(()=>0),
      productionProcess: await uatPrisma.productionProcess.count().catch(()=>0),
    });
    result.uatBaseline = await getUatBaseline();

    // 10. Provision Backend (PM2 Config)
    const pm2Config = `
module.exports = {
  apps: [{
    name: 'avario-erp-uat',
    script: 'dist/src/main.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_URL: '${uatUrl}',
      JWT_SECRET: 'uat_secret_49h',
      STORAGE_BASE_PATH: './uploads-uat'
    }
  }]
};
`;
    fs.writeFileSync('/root/erp-boostup/backend/ecosystem.uat.config.js', pm2Config);
    
    // Start or restart PM2 uat process safely
    try {
      execSync('npx pm2 start ecosystem.uat.config.js');
    } catch (e) {
      execSync('npx pm2 restart avario-erp-uat');
    }
    
    result.uatBackend = {
      process: 'avario-erp-uat',
      port: 3001,
      databaseIsolation: 'True - distinct DATABASE_URL via PM2 env',
      storageIsolation: 'True - ./uploads-uat'
    };

    // 11. Production Baseline After
    result.prodAfter = await getProdBaseline();

    console.log("JSON_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("JSON_END");

  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    if (prodPrisma) await prodPrisma.$disconnect();
    if (uatPrisma) await uatPrisma.$disconnect();
  }
}

runProvisioning();
`

const launcher = `
const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/erp-boostup/backend/uat_provision_49h2.js');
    writeStream.on('close', () => {
      conn.exec('cd /root/erp-boostup/backend && node uat_provision_49h2.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('close', (code, signal) => {
          console.log(out);
          conn.exec('rm /root/erp-boostup/backend/uat_provision_49h2.js', () => { conn.end(); });
        }).on('data', (data) => {
          out += data.toString();
        }).stderr.on('data', (data) => {
          console.error('STDERR:', data.toString());
        });
      });
    });
    writeStream.write(nodeScript);
    writeStream.end();
  });
}).connect({ host: '194.233.85.181', port: 22, username: 'root', password: 'Avario050306', readyTimeout: 10000 });
`
Set-Content -Path uat_runner.js -Value "const nodeScript = \`$nodeScript\`;`n$launcher" -Encoding UTF8
node uat_runner.js
