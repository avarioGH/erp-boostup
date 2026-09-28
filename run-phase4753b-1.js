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
  const tsCheck = `
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.timberVariant.count();
  console.log('TIMBERVARIANT_COUNT=' + count);
  await prisma.$disconnect();
}
main().catch(console.error);
`;

  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    
    cat << 'EOF' > check-count.ts
${tsCheck}
EOF
    npx ts-node check-count.ts
    
    # Also check Prisma DB provider
    grep "provider" prisma/schema.prisma | grep "mongodb" && echo "DB_IS_MONGODB=true" || echo "DB_IS_MONGODB=false"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
