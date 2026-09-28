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
    cd /root/erp-boostup/backend || exit 1
    echo "=== CHECK OTHER CONTROLLERS FOR REQ ==="
    grep -rn "@Req" src/ | head -n 10
    
    echo "=== CHECK import.service.ts EXECUTE METHOD ==="
    cat src/inventory/import/import.service.ts | grep -n -A 20 "executeImport"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
