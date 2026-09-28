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
import { InputLogService } from './src/inventory/input-log.service';
import { InventoryLedgerService } from './src/inventory/inventory-ledger.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const sawnTimberService = app.get(SawnTimberService);
  const rawLogService = app.get(RawLogService);
  const inputLogService = app.get(InputLogService);

  const report: any = { before: {}, after: {} };

  async function getCounts() {
    return {
      Company: await prisma.company.count(),
      Warehouse: await prisma.warehouse.count(),
      Location: await prisma.location.count(),
      Species: await prisma.timberSpecies.count(),
      Grade: await prisma.timberGrade.count(),
      Source: await prisma.timberSource.count(),
      TimberVariant: await prisma.timberVariant.count(),
      TimberStock: await prisma.timberStock.count(),
      TimberStockMovement: await prisma.timberStockMovement.count(),
      Reservation: await prisma.timberStockReservation.count(),
      RawLog: await prisma.rawLog.count(),
      InputLog: await prisma.inputLog.count(),
      SawnTimberOutput: await prisma.sawnTimberOutput.count()
    };
  }

  report.before = await getCounts();
  console.log("=== BEFORE UAT SNAPSHOT ===");
  console.table(report.before);

  const email = 'kayu@boostup.id';
  const user = await prisma.user.findFirst({ where: { email } });
  const companyId = user!.company_id as string;

  const whMain = await prisma.warehouse.findFirst({ where: { company_id: companyId, code: 'WH-MAIN' } });
  const locIn = await prisma.location.findFirst({ where: { warehouse: { company_id: companyId }, code: 'LOC-IN' } });
  const sup01 = await prisma.timberSource.findFirst({ where: { company_id: companyId, code: 'SUP-01' } });
  const meranti = await prisma.timberSpecies.findFirst({ where: { company_id: companyId, code: 'MERANTI' } });
  const gradeA = await prisma.timberGrade.findFirst({ where: { company_id: companyId, code: 'A' } });
  const gradeLKL = await prisma.timberGrade.findFirst({ where: { company_id: companyId, code: 'LKL' } });
  
  // Mark inactive to test inactive grade
  await prisma.timberGrade.update({ where: { id: gradeLKL!.id }, data: { isActive: false } });

  // PART C - Receiving
  const rawLog = await rawLogService.create({
    logNumber: 'UAT-4782-RAW-001',
    date: new Date(),
    species: meranti!.code,
    speciesId: meranti!.id,
    sourceId: sup01!.id,
    locationId: whMain!.id,
    length: 4000,
    diameter1: 40, diameter2: 40, diameter3: 40, diameter4: 40
  }, { id: user!.id, company_id: companyId } as any);
  console.log("RawLog Created:", rawLog.logNumber);

  // PART D - Input Log
  const inputLog = await inputLogService.create({
    rawLogId: rawLog.id,
    operatorName: 'UAT',
    notes: 'UAT input'
  });
  console.log("InputLog Created:", inputLog.inputNumber);

  // PART E - Single Grade Production
  const payloadSingle = {
    inputLogId: inputLog.id,
    locationId: whMain!.id,
    batch: 'UAT-4782-A',
    items: [{ gradeId: gradeA!.id, quantityPcs: 10, thickness: 20, width: 100, length: 4000 }]
  };
  const outputSingle = await sawnTimberService.createOutput(payloadSingle);
  console.log("Single Grade Output Created:", outputSingle.bundleNumber);

  // Verify variant
  const out1 = await prisma.sawnTimberOutput.findUnique({ where: { id: outputSingle.id }, include: { items: { include: { timberVariant: true } } } });
  console.log("Single Grade Variant:", out1!.items[0].timberVariant.sku, out1!.items[0].timberVariant.barcode);

  // PART P - Negative Test Inactive Grade
  try {
    await sawnTimberService.createOutput({
      inputLogId: inputLog.id,
      locationId: whMain!.id,
      batch: 'UAT-4782-MULTI',
      items: [
        { gradeId: gradeA!.id, quantityPcs: 20, thickness: 30, width: 100, length: 4000 },
        { gradeId: gradeLKL!.id, quantityPcs: 20, thickness: 30, width: 100, length: 4000 }
      ]
    });
    console.log("ERROR: Multi Grade Output created with inactive grade");
  } catch (e: any) {
    console.log("Inactive grade rejected:", e.message);
  }

  // Restore Grade
  await prisma.timberGrade.update({ where: { id: gradeLKL!.id }, data: { isActive: true } });

  // PART F - Multi-Grade Production
  const outputMulti = await sawnTimberService.createOutput({
      inputLogId: inputLog.id,
      locationId: whMain!.id,
      batch: 'UAT-4782-MULTI',
      items: [
        { gradeId: gradeA!.id, quantityPcs: 20, thickness: 30, width: 100, length: 4000 },
        { gradeId: gradeLKL!.id, quantityPcs: 20, thickness: 30, width: 100, length: 4000 }
      ]
  });
  console.log("Multi Grade Output Created:", outputMulti.bundleNumber);
  
  const outMulti = await prisma.sawnTimberOutput.findUnique({ where: { id: outputMulti.id }, include: { items: { include: { timberVariant: true } } } });
  console.log("Multi Grade Items:");
  outMulti!.items.forEach(i => console.log(" - Variant:", i.timberVariant.sku, i.timberVariant.barcode));

  // PART G - Variant Reuse
  const outputReuse = await sawnTimberService.createOutput({ ...payloadSingle, batch: 'UAT-4782-REUSE' });
  console.log("Variant Reuse Output Created:", outputReuse.bundleNumber);

  // POST
  await sawnTimberService.postOutput(outputSingle.id);
  await sawnTimberService.postOutput(outputMulti.id);
  await sawnTimberService.postOutput(outputReuse.id);
  console.log("Outputs POSTED");

  // Verify Ledger
  const movements = await prisma.timberStockMovement.findMany({ where: { batch: { startsWith: 'UAT-4782' } } });
  console.log("Total IN movements:", movements.length);
  movements.forEach(m => console.log(\` [\${m.batch}] \${m.type} \${m.referenceType} \${m.quantityPcs}\`));

  // Validate Stock before cancel
  const stockBefore = await prisma.timberStock.findMany({ where: { batch: { startsWith: 'UAT-4782' } }, include: { timberVariant: true } });
  console.log("Stock before cancel:");
  stockBefore.forEach(s => console.log(\` [\${s.batch}] \${s.timberVariant.sku} = \${s.currentPcs} pcs\`));

  // Cancel
  await sawnTimberService.cancelOutput(outputSingle.id);
  await sawnTimberService.cancelOutput(outputMulti.id);
  await sawnTimberService.cancelOutput(outputReuse.id);
  console.log("Outputs CANCELLED");

  // Double Cancel
  try {
    await sawnTimberService.cancelOutput(outputSingle.id);
    console.log("ERROR: Double cancel worked");
  } catch (e: any) {
    console.log("Double cancel blocked:", e.message);
  }

  // Validate Stock after cancel
  const stockAfter = await prisma.timberStock.findMany({ where: { batch: { startsWith: 'UAT-4782' } }, include: { timberVariant: true } });
  console.log("Stock after cancel:");
  stockAfter.forEach(s => console.log(\` [\${s.batch}] \${s.timberVariant.sku} = \${s.currentPcs} pcs\`));

  const movOut = await prisma.timberStockMovement.findMany({ where: { type: 'OUT', batch: { startsWith: 'UAT-4782' } } });
  console.log("Total OUT movements:", movOut.length);
  movOut.forEach(m => console.log(\` [\${m.batch}] \${m.type} \${m.referenceType} \${m.quantityPcs}\`));

  // Negative Tests
  try {
    await sawnTimberService.createOutput({
      inputLogId: inputLog.id, locationId: whMain!.id, batch: 'UAT-NEG',
      items: [{ quantityPcs: 10, thickness: 10, width: 10, length: 10 }]
    });
  } catch(e: any) {
    console.log("Missing grade rejected:", e.message);
  }

  // Traceability
  console.log(\`Traceability: Output (\${outputSingle.id}) -> InputLog (\${inputLog.id}) -> RawLog (\${rawLog.id})\`);
  
  // Cleanup
  console.log("Cleaning up UAT data...");
  await prisma.timberStockMovement.deleteMany({ where: { batch: { startsWith: 'UAT-4782' } } });
  await prisma.timberStock.deleteMany({ where: { batch: { startsWith: 'UAT-4782' } } });
  
  await prisma.sawnTimberOutputItem.deleteMany({ where: { outputId: { in: [outputSingle.id, outputMulti.id, outputReuse.id] } } });
  await prisma.sawnTimberOutput.deleteMany({ where: { id: { in: [outputSingle.id, outputMulti.id, outputReuse.id] } } });
  
  await prisma.inputLog.delete({ where: { id: inputLog.id } });
  await prisma.rawLog.delete({ where: { id: rawLog.id } });

  report.after = await getCounts();
  console.log("=== AFTER UAT SNAPSHOT ===");
  console.table(report.after);

  await app.close();
}
main().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > test-4782.ts
${tsCode}
EOF
    npx ts-node test-4782.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
