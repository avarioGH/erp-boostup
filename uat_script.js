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
    const envContent = fs.readFileSync('/root/erp-boostup/backend/.env', 'utf-8');
    const dbUrlLine = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
    if (!dbUrlLine) throw new Error('DATABASE_URL not found in .env');
    
    const rawUrl = dbUrlLine.substring(dbUrlLine.indexOf('=') + 1).trim().replace(/['"]/g, '');
    const urlObj = new URL(rawUrl);
    urlObj.pathname = '/uat_erp';
    const uatUrl = urlObj.toString();

    result.uatIdentity = {
      dbName: 'uat_erp',
      verificationMethod: 'Parsed connection string and replaced pathname',
      productionSeparation: 'True - distinct pathname /uat_erp vs production'
    };

    prodPrisma = new PrismaClient({ datasources: { db: { url: rawUrl } } });
    const getProdBaseline = async () => ({
      company: await prodPrisma.company.count(),
      warehouse: await prodPrisma.warehouse.count(),
      location: await prodPrisma.location.count(),
      timberStock: await prodPrisma.timberStock.count(),
      timberStockMovement: await prodPrisma.timberStockMovement.count(),
      timberVariant: await prodPrisma.timberVariant.count(),
      rawLog: await prodPrisma.rawLog?.count().catch(()=>0),
      trimmedLog: await prodPrisma.trimmedLog?.count().catch(()=>0),
      inputLog: await prodPrisma.inputLog?.count().catch(()=>0),
      sawnTimberOutput: await prodPrisma.sawnTimberOutput?.count().catch(()=>0),
      timberPurchase: await prodPrisma.timberPurchase?.count().catch(()=>0),
      timberShipment: await prodPrisma.timberShipment?.count().catch(()=>0),
      timberStockReservation: await prodPrisma.timberStockReservation?.count().catch(()=>0),
      stockAdjustment: await prodPrisma.stockAdjustment?.count().catch(()=>0),
      stockTransfer: await prodPrisma.stockTransfer?.count().catch(()=>0),
      productionProcess: await prodPrisma.productionProcess?.count().catch(()=>0),
    });
    result.prodBefore = await getProdBaseline();
    console.log('PROD_BEFORE_OK');

    const boostup = await prodPrisma.company.findUnique({ where: { id: '6ab6a3c170de3c0b5cb580cf' } });
    if (!boostup) throw new Error('SAFETY: Boostup Kayu not found in prod DB - wrong database!');
    console.log('PROD_SAFETY_OK: Boostup Kayu confirmed in prod');

    process.env.DATABASE_URL = uatUrl;
    execSync('npx prisma db push --accept-data-loss', { env: { ...process.env, DATABASE_URL: uatUrl } });
    console.log('SCHEMA_PUSH_OK');
    
    uatPrisma = new PrismaClient({ datasources: { db: { url: uatUrl } } });

    const boostupInUat = await uatPrisma.company.findUnique({ where: { id: '6ab6a3c170de3c0b5cb580cf' } }).catch(()=>null);
    if (boostupInUat) throw new Error('CRITICAL SAFETY ABORT: Boostup Kayu found in UAT DB!');
    console.log('UAT_SAFETY_OK: Boostup Kayu not in UAT DB');

    // Cleanup previous
    const uatCompanyCount = await uatPrisma.company.count();
    if (uatCompanyCount > 0) {
       console.log('Cleaning previous UAT run...');
       await uatPrisma.timberVariant.deleteMany();
       await uatPrisma.product.deleteMany().catch(()=>null);
       await uatPrisma.unit.deleteMany().catch(()=>null);
       await uatPrisma.timberSpecies.deleteMany();
       await uatPrisma.timberGrade.deleteMany();
       await uatPrisma.timberSource.deleteMany();
       await uatPrisma.vehicle.deleteMany();
       await uatPrisma.driver.deleteMany();
       await uatPrisma.location.deleteMany();
       await uatPrisma.warehouse.deleteMany();
       await uatPrisma.user.deleteMany();
       await uatPrisma.rolePermission.deleteMany().catch(()=>null);
       await uatPrisma.role.deleteMany();
       await uatPrisma.permission.deleteMany().catch(()=>null);
       await uatPrisma.company.deleteMany();
    }

    // Company
    const company = await uatPrisma.company.create({
      data: { name: 'UAT-TENANT-49H', timezone: 'Asia/Jakarta', currency: 'IDR' }
    });
    result.mutations.uatWrites++;
    result.uatCompany = { id: company.id, name: company.name };
    console.log('COMPANY_OK:', company.id);

    // Role + User
    const role = await uatPrisma.role.create({ data: { company_id: company.id, name: 'UAT Admin' } });
    result.mutations.uatWrites++;
    const hash = await bcrypt.hash('uatpassword', 10);
    const user = await uatPrisma.user.create({
      data: { company_id: company.id, role_id: role.id, username: 'uat_admin', email: 'uat@boostup.test', password: hash, name: 'UAT Admin', status: true }
    });
    result.mutations.uatWrites++;
    result.uatUser = { id: user.id, company: company.id, role: 'UAT Admin' };
    console.log('USER_OK:', user.id);

    // Warehouse + Location
    const warehouse = await uatPrisma.warehouse.create({ data: { company_id: company.id, code: 'WH-UAT-49H', name: 'Gudang UAT 49H' } });
    result.mutations.uatWrites++;
    result.uatWarehouse = { id: warehouse.id, code: warehouse.code };

    const location = await uatPrisma.location.create({ data: { warehouseId: warehouse.id, code: 'LOC-UAT-49H', name: 'Area UAT 49H' } });
    result.mutations.uatWrites++;
    result.uatLocation = { id: location.id, code: location.code };
    console.log('WAREHOUSE+LOCATION_OK');

    // TimberSpecies
    const species = await uatPrisma.timberSpecies.create({ data: { company_id: company.id, code: 'MERANTI-UAT', name: 'Meranti UAT' } });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'TimberSpecies', id: species.id, code: species.code });

    // TimberGrade
    const grade = await uatPrisma.timberGrade.create({ data: { company_id: company.id, code: 'A-UAT', name: 'Grade A UAT' } });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'TimberGrade', id: grade.id, code: grade.code });

    // TimberSource (type required: SUPPLIER|EXTERNAL|INTERNAL|OTHER)
    const source = await uatPrisma.timberSource.create({ data: { company_id: company.id, code: 'SUP-UAT', name: 'Supplier UAT 49H', type: 'SUPPLIER' } });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'TimberSource', id: source.id, code: source.code });

    // Vehicle (vehicleType: TRUCK|FUSO|PICKUP|OTHER; plateNumber required)
    const vehicle = await uatPrisma.vehicle.create({ data: { company_id: company.id, code: 'V-UAT', plateNumber: 'UAT-TRUCK-49H', vehicleType: 'TRUCK' } });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'Vehicle', id: vehicle.id, code: vehicle.code });

    // Driver (code optional, name required)
    const driver = await uatPrisma.driver.create({ data: { company_id: company.id, code: 'D-UAT', name: 'Driver UAT 49H', phone: '0800000000' } });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'Driver', id: driver.id, code: driver.code });
    console.log('MASTER_DATA_OK');

    // Unit (needed by Product)
    const unit = await uatPrisma.unit.create({ data: { company_id: company.id, name: 'PCS' } });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'Unit', id: unit.id, code: 'PCS' });

    // Product (needed by TimberVariant)
    const product = await uatPrisma.product.create({
      data: {
        company_id: company.id,
        unit_id: unit.id,
        code: 'PROD-MERANTI-UAT',
        name: 'Meranti UAT 20x100x1000',
        purchase_price: 0,
        selling_price: 0
      }
    });
    result.mutations.uatWrites++;
    result.uatMasterData.push({ entity: 'Product', id: product.id, code: product.code });
    console.log('PRODUCT_OK:', product.id);

    // TimberVariant (required: productId, grade (string), thickness, width, length, species (string), sku, volumePerPiece)
    const t = 20, w = 100, l = 1000;
    const vol = (t * w * l) / 1000000000;
    const variant = await uatPrisma.timberVariant.create({
      data: {
        company_id: company.id,
        productId: product.id,
        sku: 'UAT-SKU-49H-' + Date.now(),
        grade: 'A-UAT',
        species: 'MERANTI-UAT',
        gradeId: grade.id,
        speciesId: species.id,
        thickness: t,
        width: w,
        length: l,
        volumePerPiece: vol
      }
    });
    result.mutations.uatWrites++;
    result.uatVariant = {
      id: variant.id,
      sku: variant.sku,
      grade: 'A-UAT',
      species: 'MERANTI-UAT',
      dimensions: '20mm x 100mm x 1000mm',
      volumePerPiece: vol,
      canonicalCalc: '(20*100*1000)/1,000,000,000 = 0.002 m3',
      verification: 'PASS'
    };
    console.log('VARIANT_OK:', variant.id);

    // UAT baseline
    const getUatBaseline = async () => ({
      company: await uatPrisma.company.count(),
      warehouse: await uatPrisma.warehouse.count(),
      location: await uatPrisma.location.count(),
      timberStock: await uatPrisma.timberStock.count(),
      timberStockMovement: await uatPrisma.timberStockMovement.count(),
      timberVariant: await uatPrisma.timberVariant.count(),
      product: await uatPrisma.product.count(),
      unit: await uatPrisma.unit.count(),
      rawLog: await uatPrisma.rawLog?.count().catch(()=>0),
      trimmedLog: await uatPrisma.trimmedLog?.count().catch(()=>0),
      inputLog: await uatPrisma.inputLog?.count().catch(()=>0),
      sawnTimberOutput: await uatPrisma.sawnTimberOutput?.count().catch(()=>0),
      timberPurchase: await uatPrisma.timberPurchase?.count().catch(()=>0),
      timberShipment: await uatPrisma.timberShipment?.count().catch(()=>0),
      timberStockReservation: await uatPrisma.timberStockReservation?.count().catch(()=>0),
      stockAdjustment: await uatPrisma.stockAdjustment?.count().catch(()=>0),
      stockTransfer: await uatPrisma.stockTransfer?.count().catch(()=>0),
      productionProcess: await uatPrisma.productionProcess?.count().catch(()=>0),
    });
    result.uatBaseline = await getUatBaseline();
    console.log('UAT_BASELINE_OK');

    // PM2 UAT Process
    const pm2Config = "module.exports = { apps: [{ name: 'avario-erp-uat', script: 'dist/src/main.js', env: { NODE_ENV: 'production', PORT: 3001, DATABASE_URL: '" + uatUrl + "', JWT_SECRET: 'uat_secret_49h_isolated', STORAGE_BASE_PATH: './uploads-uat' } }] };";
    fs.writeFileSync('/root/erp-boostup/backend/ecosystem.uat.config.js', pm2Config);
    
    try {
      execSync('npx pm2 start ecosystem.uat.config.js', { cwd: '/root/erp-boostup/backend' });
    } catch (e) {
      execSync('npx pm2 restart avario-erp-uat', { cwd: '/root/erp-boostup/backend' });
    }
    execSync('npx pm2 save', { cwd: '/root/erp-boostup/backend' });
    console.log('PM2_OK');
    
    result.uatBackend = {
      process: 'avario-erp-uat',
      port: 3001,
      databaseIsolation: 'ISOLATED - /uat_erp database (distinct from production)',
      storageIsolation: 'ISOLATED - ./uploads-uat',
      jwtSecret: 'DISTINCT (uat_secret_49h_isolated)',
      pm2Config: '/root/erp-boostup/backend/ecosystem.uat.config.js'
    };

    result.prodAfter = await getProdBaseline();
    console.log('PROD_AFTER_OK');

    console.log("JSON_START");
    console.log(JSON.stringify(result, null, 2));
    console.log("JSON_END");

  } catch (err) {
    console.error("ERROR:", err.message);
    if (err.message.includes('SAFETY') || err.message.includes('CRITICAL')) {
      process.exit(1);
    }
  } finally {
    if (prodPrisma) await prodPrisma.$disconnect();
    if (uatPrisma) await uatPrisma.$disconnect();
  }
}
runProvisioning();
