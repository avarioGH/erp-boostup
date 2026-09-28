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
    
    echo "=== HARDCODE AUDIT ==="
    grep -rnEi "Ulin|Meranti|Bengkirai|Grade A|Grade B|Grade C|APM|BKR|LOCAL|LOKAL|AF|LKL|Kalteng|GDNG01|BLOK-A|BLOK-B" backend/src frontend/src | head -n 30 || echo "NO MATCHES"
    
    echo "=== VARIANT CREATION ==="
    grep -rn "getOrCreateTimberVariant" backend/src || echo "NOT FOUND"
    grep -rn "create.*TimberVariant" backend/src | head -n 10
    
    echo "=== SAWN TIMBER OUTPUT ==="
    cat backend/src/manufacturing/sawn-timber/sawn-timber.service.ts | grep -i "grade" | head -n 10 || echo "NO SAWN TIMBER"
    
    echo "=== TSC CHECK ==="
    cd backend && npx tsc --noEmit
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
