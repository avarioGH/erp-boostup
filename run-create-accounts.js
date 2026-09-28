const { Client } = require('ssh2');
const bcrypt = require('bcrypt');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

async function main() {
  // Pre-hash the password locally before sending to VPS
  const hashedPassword = await bcrypt.hash('owner123', 10);
  console.log('Password hashed locally:', hashedPassword.substring(0, 20) + '...');

  conn.on('ready', () => {
    const tsCode = `
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {

  // ============================================================
  // 1. Create Company for KAYU
  // ============================================================
  const kayuCompany = await prisma.company.create({
    data: {
      name: 'Boostup Kayu',
      email: 'kayu@boostup.id',
      phone: '',
      address: '',
      timezone: 'Asia/Jakarta',
    }
  });
  console.log('KAYU_COMPANY:', kayuCompany.id);

  // ============================================================
  // 2. Create Owner Role for KAYU company
  // ============================================================
  const kayuRole = await prisma.role.create({
    data: {
      name: 'Owner',
      company_id: kayuCompany.id,
    }
  });
  console.log('KAYU_ROLE:', kayuRole.id);

  // ============================================================
  // 3. Create User KAYU — accessible_modules = timber only
  // ============================================================
  const kayuUser = await prisma.user.create({
    data: {
      company_id: kayuCompany.id,
      role_id: kayuRole.id,
      username: 'kayu',
      name: 'Admin Kayu',
      email: 'kayu@boostup.id',
      password: '${hashedPassword}',
      status: true,
      accessible_modules: ['inventory', 'purchasing', 'production', 'sales', 'settings'],
    }
  });
  console.log('KAYU_USER:', kayuUser.id);

  // ============================================================
  // 4. Create Company for IKAN
  // ============================================================
  const ikanCompany = await prisma.company.create({
    data: {
      name: 'Boostup Ikan',
      email: 'ikan@boostup.id',
      phone: '',
      address: '',
      timezone: 'Asia/Jakarta',
    }
  });
  console.log('IKAN_COMPANY:', ikanCompany.id);

  // ============================================================
  // 5. Create Owner Role for IKAN company
  // ============================================================
  const ikanRole = await prisma.role.create({
    data: {
      name: 'Owner',
      company_id: ikanCompany.id,
    }
  });
  console.log('IKAN_ROLE:', ikanRole.id);

  // ============================================================
  // 6. Create User IKAN — all modules EXCEPT timber inventory
  // ============================================================
  const ikanUser = await prisma.user.create({
    data: {
      company_id: ikanCompany.id,
      role_id: ikanRole.id,
      username: 'ikan',
      name: 'Admin Ikan',
      email: 'ikan@boostup.id',
      password: '${hashedPassword}',
      status: true,
      accessible_modules: ['manufacturing', 'production', 'sales', 'pos', 'crm', 'finance', 'hr', 'settings', 'purchasing'],
    }
  });
  console.log('IKAN_USER:', ikanUser.id);

  console.log('ALL_DONE');
  await prisma.$disconnect();
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
`;

    const cmd = `
      cd /root/erp-boostup/backend || exit 1
      cat << 'EOF' > create-accounts.ts
${tsCode}
EOF
      npx ts-node create-accounts.ts
    `;

    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', () => conn.end())
        .on('data', d => process.stdout.write(d.toString()));
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
    });
  }).connect(config);
}

main().catch(console.error);
