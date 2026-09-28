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
    cd /root/erp-boostup/frontend || exit 1
    
    echo "=== LS MASTER DATA ROUTES ==="
    find src/app/inventory/master-data -type f
    
    echo "=== CAT SPECIES PAGE ==="
    cat src/app/inventory/master-data/species/page.tsx || echo "NO SPECIES PAGE"
    
    echo "=== CAT API WRAPPER ==="
    cat src/lib/api.ts | head -n 25
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
