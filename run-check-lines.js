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
  // Show exact lines 299-310 of batch-audit.service.ts
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    sed -n '299,312p' src/inventory/reconciliation/batch-audit.service.ts
    echo "---"
    grep -n "TimberPurchaseItem" prisma/schema.prisma | head -n 5
    grep -A 10 "model TimberPurchaseItem" prisma/schema.prisma | head -n 12
    grep -A 5 "model ProductionProcessOutput" prisma/schema.prisma | head -n 7
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect(config);
