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
    
    echo "=== TIMBER VARIANT UNIQUE ==="
    grep "@@unique" prisma/schema.prisma -B 2 -A 2 | grep -E -B 5 -A 5 "sku"
    grep "@unique" prisma/schema.prisma | grep -i "sku"
    
    echo "=== TIMBER STOCK UNIQUE ==="
    grep "@@unique" prisma/schema.prisma | grep "locationId"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
