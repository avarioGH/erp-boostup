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
  
  // Find standard 'Admin' role or 'User' role
  const roles = await prisma.role.findMany();
  let adminRole = roles.find(r => r.name !== 'Owner');
  if (!adminRole) {
    console.log("No non-owner role found.");
    return;
  }
  
  await prisma.user.updateMany({
    where: { email: { in: ['kayu@boostup.id', 'ikan@boostup.id'] } },
    data: { role_id: adminRole.id }
  });
  
  console.log("Updated roles for kayu and ikan to:", adminRole.name);

  await app.close();
}
main().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > fix-role.ts
${tsCode}
EOF
    npx ts-node fix-role.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
