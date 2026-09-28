const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > test-prod3.ts
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.user.findFirst({where:{email:'kayu@boostup.id'}}).then(u => {
  console.log('User company:', u?.company_id);
  if (!u) return p.$disconnect();
  return p.product.findFirst({where:{company_id: u.company_id as string}}).then(pr => {
    console.log('Product:', pr);
  });
}).finally(()=>p.$disconnect());
EOF
    npx ts-node test-prod3.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
