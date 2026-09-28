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
  const cmd = `
    cd /root/erp-boostup/backend || exit 1

    echo "=== AUTH SERVICE LOGIN ==="
    cat src/auth/auth.service.ts | grep -n -A 20 "async login"

    echo "=== PERMISSIONS ==="
    cat src/auth/permissions.guard.ts | head -n 40

    echo "=== CHECK EXISTING COMPANIES ==="
    npx --yes ts-node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const companies = await prisma.company.findMany({ select: { id: true, name: true, email: true } });
  console.log(JSON.stringify(companies, null, 2));
  const roles = await prisma.role.findMany({ select: { id: true, name: true } });
  console.log('ROLES:', JSON.stringify(roles, null, 2));
  await prisma.\$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
" 2>&1
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect(config);
