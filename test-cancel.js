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

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const sawnTimberService = app.get(SawnTimberService);
  
  const user = await prisma.user.findUnique({ where: { email: 'kayu@boostup.id' } });
  const companyId = user!.company_id as string;
  const whIds = (await prisma.warehouse.findMany({ where: { company_id: companyId } })).map(w => w.id);

  const loc = await prisma.location.findFirst({ where: { code: 'LOC-IN', warehouse: { company_id: companyId } } });
  const variant = await prisma.timberVariant.findFirst({ where: { company_id: companyId } });

  console.log("Variant:", variant?.id);

  if (variant && loc) {
    let output = await prisma.sawnTimberOutput.create({
      data: {
        bundleNumber: 'TEST-CANCEL-1',
        outputDate: new Date(),
        locationId: loc.warehouseId,
        inputLogId: (await prisma.inputLog.findFirst())?.id || '000000000000000000000000',
        batch: 'TEST-BATCH',
        status: 'DRAFT',
        items: {
          create: [
            {
              timberVariantId: variant.id,
              grade: variant.grade,
              quantityPcs: 10,
              thicknessMm: variant.thickness,
              widthMm: variant.width,
              lengthMm: variant.length,
              volumeM3: 0.1
            }
          ]
        }
      }
    });

    await sawnTimberService.postOutput(output.id);
    console.log("POSTED");
    let stock = await prisma.timberStock.findFirst({ where: { batch: 'TEST-BATCH' } });
    console.log("Stock after POST:", stock?.currentPcs);

    await sawnTimberService.cancelOutput(output.id);
    console.log("CANCELLED");
    stock = await prisma.timberStock.findFirst({ where: { batch: 'TEST-BATCH' } });
    console.log("Stock after CANCEL:", stock?.currentPcs);

    // cleanup
    await prisma.timberStockMovement.deleteMany({ where: { batch: 'TEST-BATCH' } });
    await prisma.timberStock.deleteMany({ where: { batch: 'TEST-BATCH' } });
    await prisma.sawnTimberOutputItem.deleteMany({ where: { outputId: output.id } });
    await prisma.sawnTimberOutput.delete({ where: { id: output.id } });
  }

  await app.close();
}
main().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > test-cancel.ts
${tsCode}
EOF
    npx ts-node test-cancel.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
