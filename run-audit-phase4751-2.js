const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 20000
};

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    
    echo "=== RAW LOG SPECIES CHECK ==="
    cat src/inventory/raw-log.service.ts | grep -n -A 10 "speciesId"
    
    echo "=== INVENTORY LEDGER SUBLOCATION ==="
    cat src/inventory/inventory-ledger.service.ts | grep -n -A 10 "subLocationId"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
