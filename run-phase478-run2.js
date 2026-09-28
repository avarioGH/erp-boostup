const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const tsCode = `
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/prisma/prisma.service';
import { SawnTimberService } from './src/inventory/sawn-timber.service';
import { RawLogService } from './src/inventory/raw-log.service';

async function main() {
  console.log("Bootstrapping NestJS Context...");
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const sawnTimberService = app.get(SawnTimberService);
  const rawLogService = app.get(RawLogService);
  
  const user = await prisma.user.findUnique({ where: { email: 'kayu@boostup.id' } });
  const companyId = user!.company_id as string;

  const locs = await prisma.location.findMany({ where: { warehouse: { company_id: companyId } } });
  const locIds = locs.map(l => l.id);
  const whIds = (await prisma.warehouse.findMany({ where: { company_id: companyId } })).map(w => w.id);

  console.log("=== BASELINE ===");
  const baseline = {
    TimberVariant: await prisma.timberVariant.count({ where: { company_id: companyId } }),
    TimberStock: await prisma.timberStock.count({ where: { locationId: { in: whIds } } }), 
    RawLog: await prisma.rawLog.count(), 
    InputLog: await prisma.inputLog.count(),
    ProductionOutput: await prisma.sawnTimberOutput.count()
  };
  console.log(baseline);

  const loc = await prisma.location.findFirst({ where: { code: 'LOC-IN', warehouse: { company_id: companyId } }, include: { warehouse: true } });
  const species = await prisma.timberSpecies.findFirst({ where: { code: 'MERANTI', company_id: companyId } });
  const source = await prisma.timberSource.findFirst({ where: { code: 'SUP-01', company_id: companyId } });
  const gradeA = await prisma.timberGrade.findFirst({ where: { code: 'A', company_id: companyId } });
  const gradeLKL = await prisma.timberGrade.findFirst({ where: { code: 'LKL', company_id: companyId } });
  
  if (!loc || !species || !source || !gradeA || !gradeLKL) {
    console.error("Missing seeded master data!");
    await app.close();
    process.exit(1);
  }

  console.log("=== RAW LOG UAT ===");
  let rawLog = await prisma.rawLog.create({
    data: {
      logNumber: 'UAT-4778-RAW-002',
      species: species.code,
      speciesId: species.id,
      sourceId: source.id,
      originalLength: 4.0,
      diameter1: 30, diameter2: 30, diameter3: 30, diameter4: 30,
      averageDiameter: 30, roundedDiameter: 30,
      grossVolume: 0.2827, netVolume: 0.2827,
      locationId: loc.warehouseId
    }
  });
  console.log("RawLog Created:", rawLog.id);

  console.log("=== INPUT LOG UAT ===");
  let inputLog = await prisma.inputLog.create({
     data: {
       inputNumber: 'UAT-4778-IN-002',
       species: species.code,
       speciesId: species.id,
       sourceId: source.id,
       totalQty: 1,
       totalVolume: 0.2827
     }
  });
  console.log("InputLog Created:", inputLog.id);

  console.log("=== SAWN TIMBER OUTPUT UAT ===");
  let output;
  try {
    const payload = {
       bundleNumber: 'UAT-4778-PROD',
       outputDate: new Date(),
       locationId: loc.warehouseId,
       inputLogId: inputLog.id,
       batch: 'UAT-BATCH-1',
       items: [
         { gradeId: gradeA.id, quantityPcs: 10, thickness: 20, width: 100, length: 4000, thicknessMm: 20, widthMm: 100, lengthMm: 4000, volumeM3: 0.08 },
         { gradeId: gradeLKL.id, quantityPcs: 5, thickness: 20, width: 100, length: 4000, thicknessMm: 20, widthMm: 100, lengthMm: 4000, volumeM3: 0.04 }
       ],
       company_id: companyId
    };
    output = await sawnTimberService.createOutput(payload);
    console.log("Output Created:", output.id);
    
    await sawnTimberService.postOutput(output.id);
    console.log("Output Posted!");
  } catch(e) {
    console.error("Error creating/posting output", e);
  }

  console.log("=== POST-UAT COUNTS ===");
  const finalCounts = {
    TimberVariant: await prisma.timberVariant.count({ where: { company_id: companyId } }),
    TimberStock: await prisma.timberStock.count({ where: { locationId: { in: whIds } } })
  };
  console.log(finalCounts);
  
  const variants = await prisma.timberVariant.findMany({ where: { company_id: companyId } });
  variants.forEach(v => console.log("Variant created:", v.sku));

  const stocks = await prisma.timberStock.findMany({ where: { locationId: { in: whIds } } });
  stocks.forEach(s => console.log("Stock:", s.currentPcs, "pcs, Vol:", s.currentVolumeM3));

  console.log("=== CANCELLATION / REVERSAL UAT ===");
  try {
    await sawnTimberService.cancelOutput(output.id);
    console.log("Output Cancelled!");
    const stocksAfterCancel = await prisma.timberStock.findMany({ where: { locationId: { in: whIds } } });
    stocksAfterCancel.forEach(s => console.log("Stock after cancel:", s.currentPcs, "pcs"));
  } catch(e) {
    console.error("Cancel failed:", e);
  }

  // CLEANUP UAT
  if (output) {
    await prisma.sawnTimberOutputItem.deleteMany({ where: { outputId: output.id } });
    await prisma.sawnTimberOutput.delete({ where: { id: output.id } });
  }
  await prisma.inputLog.delete({ where: { id: inputLog.id } });
  await prisma.rawLog.delete({ where: { id: rawLog.id } });
  
  // Clean up stock movements? Yes, ledger cleanup
  await prisma.timberStockMovement.deleteMany({ where: { timberStock: { locationId: { in: whIds } } } });
  await prisma.timberStock.deleteMany({ where: { locationId: { in: whIds } } });
  await prisma.timberVariant.deleteMany({ where: { company_id: companyId } });

  console.log("Cleanup finished.");

  await app.close();
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
    cat << 'EOF' > run-phase478-uat2.ts
${tsCode}
EOF
    npx ts-node run-phase478-uat2.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
