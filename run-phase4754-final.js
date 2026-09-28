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
    
    echo "=== CLEANING UP REMAINING TEMP SCRIPTS ==="
    rm -f frontend-fix.js 2>/dev/null
    
    cd backend
    rm -f patch_import.py check-db.ts check-users.ts create-accounts.ts delete-owner.ts 2>/dev/null
    
    echo "=== VERIFYING BUILD ==="
    npx tsc --noEmit
    
    cd ../frontend
    npm run build
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
