const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 15000
};

conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup || exit 1
    
    echo "=== SCHEMA AUDIT ==="
    grep -E 'model Timber(Species|Grade|Source|Variant)|model Location' backend/prisma/schema.prisma || echo "NO SCHEMA MATCH"
    
    echo "=== ISOLATION AUDIT ==="
    grep -rin 'companyId' backend/src/master-data backend/src/inventory | wc -l
    
    echo "=== FRONTEND AUDIT ==="
    ls -l frontend/src/app/master-data || echo "NO FRONTEND MASTER DATA UI"
    
    echo "=== BACKEND BUILD ==="
    cd backend && npx tsc --noEmit || echo "TSC FAILED"
    
    echo "=== FRONTEND BUILD ==="
    cd ../frontend && npm run build || echo "FRONTEND BUILD FAILED"
    
    echo "=== TESTS ==="
    cd ../backend && npm run test || echo "TESTS FAILED"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', data => {
      process.stdout.write(data.toString());
    }).stderr.on('data', data => {
      process.stderr.write(data.toString());
    });
  });
}).connect(config);
