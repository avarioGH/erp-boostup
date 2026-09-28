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

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  console.log("Cleaning up orphaned UAT data...");
  await prisma.timberStockMovement.deleteMany({ where: { batch: { startsWith: 'UAT-4784' } } });
  await prisma.timberStock.deleteMany({ where: { batch: { startsWith: 'UAT-4784' } } });
  
  await prisma.sawnTimberOutputItem.deleteMany({ where: { batch: { startsWith: 'UAT-4784' } } });
  await prisma.sawnTimberOutput.deleteMany({ where: { batch: { startsWith: 'UAT-4784' } } });
  
  const inputLogs = await prisma.inputLog.findMany({ where: { operatorName: 'UAT-4784' } });
  for (const i of inputLogs) {
     await prisma.inputLogItem.deleteMany({ where: { inputLogId: i.id } });
  }
  await prisma.inputLog.deleteMany({ where: { operatorName: 'UAT-4784' } });
  await prisma.trimmedLog.deleteMany({ where: { trimNumber: { startsWith: 'UAT-4784' } } });
  await prisma.rawLog.deleteMany({ where: { logNumber: { startsWith: 'UAT-4784' } } });

  console.log("Cleanup done.");
  await app.close();
}
main().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > cleanup-4784.ts
${tsCode}
EOF
    npx ts-node cleanup-4784.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
