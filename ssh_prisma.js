const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = 
cat << 'EOF' > /root/erp-boostup/backend/prisma_test.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('Testing Prisma connection...');
  const start = Date.now();
  const c = await prisma.company.count();
  const end = Date.now();
  console.log('Company count:', c);
  console.log('Query took:', end - start, 'ms');
}
main().catch(e => console.error(e)).finally(() => prisma.\\$disconnect());
EOF
node /root/erp-boostup/backend/prisma_test.js
  ;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', (code, signal) => {
      console.log('RESULT:', out);
      conn.end();
    }).on('data', (data) => {
      out += data.toString();
    }).stderr.on('data', (data) => {
      out += 'STDERR: ' + data.toString();
    });
  });
}).connect({
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 10000
});
