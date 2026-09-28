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
    cd /root/erp-boostup || exit 1
    
    echo "=== CLEANING UP ROOT ==="
    rm -f run-*.js run-*.ts patch*.py db-audit.ts check-count.ts temp-* tmp-* test-*.js test-*.ts 2>/dev/null
    
    echo "=== CLEANING UP BACKEND ROOT ==="
    cd backend
    rm -f run-*.js run-*.ts patch*.py db-audit.ts check-count.ts temp-* tmp-* test-*.js test-*.ts 2>/dev/null
    
    echo "=== CLEANING UP BACKEND SRC ==="
    rm -f src/phase*.ts src/run-*.ts src/master-*.ts src/legacy-*.ts src/historical-*.ts 2>/dev/null
    
    echo "=== CLEANING CACHE ==="
    cd ../frontend
    rm -rf .next
    
    echo "=== DONE CLEANUP ==="
    
    cd ../backend
    echo "=== TSC BACKEND ==="
    npx tsc --noEmit
    
    cd ../frontend
    echo "=== BUILD FRONTEND ==="
    npm run build
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
