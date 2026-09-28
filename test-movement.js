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
import { InventoryLedgerService } from './src/inventory/inventory-ledger.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const ledger = app.get(InventoryLedgerService);
  
  const user = await prisma.user.findUnique({ where: { email: 'kayu@boostup.id' } });
  const companyId = user!.company_id as string;
  const wh = await prisma.warehouse.findFirst({ where: { company_id: companyId } });
  const variant = await prisma.timberVariant.findFirst({ where: { company_id: companyId } });

  console.log("Variant:", variant?.id);
  console.log("WH:", wh?.id);

  if (variant && wh) {
    let stock = await prisma.timberStock.create({
      data: {
        locationId: wh.id,
        timberVariantId: variant.id,
        currentPcs: 10,
        currentVolumeM3: 1,
        batch: 'TEST-DECREMENT'
      }
    });

    console.log("Initial stock:", stock.currentPcs);

    await prisma.$transaction(async tx => {
      await ledger.createMovement(tx, wh.id, variant.id, 'OUT', 'REVERSAL', 'TEST-REF', 10, 1, 'TEST-DECREMENT');
    });

    const finalStock = await prisma.timberStock.findUnique({ where: { id: stock.id } });
    console.log("Final stock after OUT REVERSAL:", finalStock?.currentPcs);

    await prisma.timberStockMovement.deleteMany({ where: { referenceId: 'TEST-REF' } });
    await prisma.timberStock.delete({ where: { id: stock.id } });
  }

  await app.close();
}
main().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > test-movement.ts
${tsCode}
EOF
    npx ts-node test-movement.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
