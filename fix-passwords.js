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
import * as bcrypt from 'bcrypt';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  
  const users = await prisma.user.findMany({
    select: { email: true, name: true, username: true, id: true }
  });
  console.log("Users:", users);

  const hash = await bcrypt.hash('owner123', 10);

  const kayu = await prisma.user.updateMany({
    where: { email: 'kayu@boostup.id' },
    data: { password: hash }
  });
  console.log("Reset kayu password:", kayu);

  const ikan = await prisma.user.updateMany({
    where: { email: 'ikan@boostup.id' },
    data: { password: hash }
  });
  console.log("Reset ikan password:", ikan);

  await app.close();
}
main().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > fix-passwords.ts
${tsCode}
EOF
    npx ts-node fix-passwords.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
