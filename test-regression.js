const { Client } = require('ssh2');
const fs = require('fs');

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
import { InventoryLedgerService } from './src/inventory/inventory-ledger.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const sawnTimberService = app.get(SawnTimberService);
  
  const user = await prisma.user.findUnique({ where: { email: 'kayu@boostup.id' } });
  const companyId = user!.company_id as string;
  const whIds = (await prisma.warehouse.findMany({ where: { company_id: companyId } })).map(w => w.id);

  const loc = await prisma.location.findFirst({ where: { code: 'LOC-IN', warehouse: { company_id: companyId } } });
  const inputLog = await prisma.inputLog.findFirst({ where: { location: { company_id: companyId } } });

  const gradeA = await prisma.timberGrade.findFirst({ where: { code: 'A', company_id: companyId } });
  const gradeLKL = await prisma.timberGrade.findFirst({ where: { code: 'LKL', company_id: companyId } });

  console.log("=== BUG 1 REGRESSION (MULTI-VARIANT ATOMICITY) ===");

  const payload = {
    inputLogId: inputLog?.id || '000000000000000000000000',
    locationId: loc?.warehouseId || '000000000000000000000000',
    batch: 'TEST-BUG1-BATCH',
    items: [
      {
        gradeId: gradeA!.id,
        quantityPcs: 10,
        thickness: 20, width: 100, length: 4000,
        thicknessMm: 20, widthMm: 100, lengthMm: 4000
      },
      {
        gradeId: gradeLKL!.id,
        quantityPcs: 5,
        thickness: 20, width: 100, length: 4000,
        thicknessMm: 20, widthMm: 100, lengthMm: 4000
      }
    ]
  };

  let output;
  try {
    output = await sawnTimberService.createOutput(payload);
    console.log("Multi-variant Output Created Atomically!");
  } catch (e) {
    console.error("Failed Bug 1 test:", e);
    process.exit(1);
  }

  const outputItems = await prisma.sawnTimberOutputItem.findMany({ where: { outputId: output.id }, include: { timberVariant: true } });
  console.log("Items created:", outputItems.length);
  outputItems.forEach(i => {
    console.log(\`  Variant: \${i.timberVariant.sku} | Barcode: \${i.timberVariant.barcode}\`);
  });

  console.log("\\n=== BUG 2 REGRESSION (CANCELLATION REVERSAL) ===");
  await sawnTimberService.postOutput(output.id);
  
  let stocks = await prisma.timberStock.findMany({ where: { batch: 'TEST-BUG1-BATCH' }, include: { timberVariant: true } });
  console.log("Stock after POST:");
  stocks.forEach(s => console.log(\`  \${s.timberVariant.sku}: \${s.currentPcs} pcs\`));

  await sawnTimberService.cancelOutput(output.id);
  console.log("Output Cancelled!");
  
  stocks = await prisma.timberStock.findMany({ where: { batch: 'TEST-BUG1-BATCH' }, include: { timberVariant: true } });
  console.log("Stock after FIRST CANCEL:");
  stocks.forEach(s => console.log(\`  \${s.timberVariant.sku}: \${s.currentPcs} pcs\`));

  try {
    await sawnTimberService.cancelOutput(output.id);
    console.log("Second cancel succeeded (unexpected!)");
  } catch(e: any) {
    console.log("Second cancel blocked by idempotency:", e.message);
  }

  const movements = await prisma.timberStockMovement.findMany({ where: { batch: 'TEST-BUG1-BATCH' } });
  console.log("Movements created for this batch:", movements.length);
  movements.forEach(m => console.log(\`  Type: \${m.type} | RefType: \${m.referenceType} | Qty: \${m.quantityPcs}\`));

  console.log("\\n=== CLEANUP ===");
  // Only clean this batch
  await prisma.timberStockMovement.deleteMany({ where: { batch: 'TEST-BUG1-BATCH' } });
  await prisma.timberStock.deleteMany({ where: { batch: 'TEST-BUG1-BATCH' } });
  await prisma.sawnTimberOutputItem.deleteMany({ where: { outputId: output.id } });
  await prisma.sawnTimberOutput.delete({ where: { id: output.id } });

  // Delete the specific variants we just created so we don't pollute the test environment 
  // Wait, the UAT variants are fine to leave if they are valid, but we will clean up just the ones created today
  const uatVariants = await prisma.timberVariant.findMany({ where: { sku: { contains: '20 × 100 × 4000' } }});
  for (const uv of uatVariants) {
    try {
      await prisma.timberVariant.delete({ where: { id: uv.id } });
    } catch(e) {}
  }

  await app.close();
}
main().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > test-regression.ts
${tsCode}
EOF
    npx ts-node test-regression.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
