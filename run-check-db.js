const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

conn.on('ready', () => {
  const tsCode = `
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const companies = await prisma.company.findMany({ select: { id: true, name: true, email: true } });
  console.log('COMPANIES:', JSON.stringify(companies));
  const roles = await prisma.role.findMany({ select: { id: true, name: true } });
  console.log('ROLES:', JSON.stringify(roles));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
`;

  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > check-db.ts
${tsCode}
EOF
    npx ts-node check-db.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect(config);
