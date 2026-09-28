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
  const rawLog = await prisma.rawLog.findUnique({ where: { logNumber: 'UAT-4784-RAW-001' } });
  if (rawLog) {
    const trimmedLogs = await prisma.trimmedLog.findMany({ where: { rawLogId: rawLog.id } });
    for (const tl of trimmedLogs) {
      // Find input logs linked to this trimmed log
      // But input-log-item links them!
      const items = await prisma.inputLogItem.findMany({ where: { trimmedLogId: tl.id } });
      for (const i of items) {
        // Output might be linked to inputLog
        const outputs = await prisma.sawnTimberOutput.findMany({ where: { inputLogId: i.inputLogId } });
        for (const out of outputs) {
          await prisma.sawnTimberOutputItem.deleteMany({ where: { outputId: out.id } });
          await prisma.sawnTimberOutput.delete({ where: { id: out.id } });
        }
        await prisma.inputLogItem.deleteMany({ where: { inputLogId: i.inputLogId } });
        await prisma.inputLog.delete({ where: { id: i.inputLogId } });
      }
      await prisma.trimmedLog.delete({ where: { id: tl.id } });
    }
    await prisma.rawLog.delete({ where: { id: rawLog.id } });
  }

  console.log("Cleanup done.");
  await app.close();
}
main().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > cleanup-4784-2.ts
${tsCode}
EOF
    npx ts-node cleanup-4784-2.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
