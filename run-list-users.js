const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 20000
};

const conn = new Client();
conn.on('ready', () => {
  const tsCode = `
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: { select: { name: true } }, company: { select: { name: true } } }
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}
main().catch(console.error);
`;

  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > check-users.ts
${tsCode}
EOF
    npx ts-node check-users.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
