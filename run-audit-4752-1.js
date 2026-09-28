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
    
    echo "=== SKU GREP BACKEND ==="
    grep -rn "sku" backend/src/ | grep -v "node_modules" | grep -v "dist" | head -n 30
    
    echo "=== SKU GREP FRONTEND ==="
    grep -rn "sku" frontend/src/ | grep -v "node_modules" | grep -v ".next" | head -n 30
    
    echo "=== SUBLOCATIONID GREP BACKEND ==="
    grep -rn "subLocationId" backend/src/ | grep -v "node_modules" | grep -v "dist"
    
    echo "=== SCHEMA UNIQUE CONSTRAINTS ==="
    cd backend
    grep -A 10 "model TimberVariant {" prisma/schema.prisma
    grep -A 10 "model TimberStock {" prisma/schema.prisma
    grep "@@unique" prisma/schema.prisma | grep -E "TimberVariant|TimberStock"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
