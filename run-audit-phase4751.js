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
    
    echo "=== PURCHASE SERVICE ==="
    cat src/inventory/purchase/purchase.service.ts | grep -n -A 30 "async create"
    
    echo "=== TIMBER VARIANT (SPECIES CHECK) ==="
    cat src/inventory/sawn-timber.service.ts | grep -n -A 20 "if (speciesId)"
    
    echo "=== RAW LOG (SPECIES CHECK) ==="
    cat src/inventory/raw-log.service.ts | grep -n -A 20 "async createRawLog"
    
    echo "=== LOCATION CHECK (STOCK PLACEMENT) ==="
    cat src/inventory/inventory-ledger.service.ts | grep -n -A 30 "locationId" | head -n 30
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
