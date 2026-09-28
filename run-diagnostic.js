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
    
    echo "=== FIND BATCH UTIL ==="
    find . -type f -name "batch.util.ts" -not -path "*/node_modules/*"
    
    echo "=== CHECK SCHEMA FOR BATCH ==="
    grep -E 'model TimberPurchaseItem|model ProductionProcessOutput|batch' backend/prisma/schema.prisma | grep -B2 -A2 'batch'
    
    echo "=== PRISMA GENERATE ==="
    cd backend && npx prisma generate
    
    echo "=== FRONTEND NPM INSTALL ==="
    cd ../frontend && npm install --legacy-peer-deps
    
    echo "=== BATCH AUDIT FIX ==="
    cd ../backend
    sed -i 's/batch: /_batch: /g' src/inventory/reconciliation/batch-audit.service.ts
    # actually, I need to know what exactly is broken before blinding fixing. Let's just sed the import if batch.util.ts was moved.
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
