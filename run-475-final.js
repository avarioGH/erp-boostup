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
    cd /root/erp-boostup/backend || exit 1
    
    echo "=== BATCH AUDIT LINES 295-310 ==="
    sed -n '295,315p' src/inventory/reconciliation/batch-audit.service.ts
    
    echo "=== LOCATION SCHEMA ==="
    grep -A 15 "model Location {" prisma/schema.prisma
    
    echo "=== TIMBERVARIANT SCHEMA ==="
    grep -A 20 "model TimberVariant {" prisma/schema.prisma
    
    echo "=== TSC CHECK FINAL ==="
    npx tsc --noEmit 2>&1 | head -n 20
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect(config);
