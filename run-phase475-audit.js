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
    
    echo "=== TSC CHECK ==="
    npx tsc --noEmit
    
    echo "=== VARIANT CREATION ==="
    cat src/inventory/sawn-timber.service.ts | grep -n -A 30 "getOrCreateTimberVariant"
    
    echo "=== RECEIVING VALIDATION ==="
    grep -n -A 20 "create(" src/inventory/raw-log/raw-log.service.ts || echo "NO RECEIVING SERVICE"
    
    echo "=== HARDCODE AUDIT ==="
    grep -rnEi "Grade A|Grade B|Grade C|LOCAL|APM|BKR|LKL|Ulin|Meranti|Bengkirai|KALTENG|GDNG01|CH-01" src ../frontend/src | head -n 30 || echo "NO HARDCODES"
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
