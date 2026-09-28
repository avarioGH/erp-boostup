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
    
    echo "=== AUTH SERVICE ==="
    find src/auth -type f | head -n 20
    
    echo "=== USER/COMPANY SCHEMA ==="
    grep -A 15 "model User {" prisma/schema.prisma | head -n 17
    grep -A 10 "model Company {" prisma/schema.prisma | head -n 12
    
    echo "=== FRONTEND SIDEBAR ==="
    cat ../frontend/src/components/ui/sidebar.tsx | head -n 60
    
    echo "=== NAVIGATION ==="
    find ../frontend/src -name "*nav*" -o -name "*sidebar*" | head -n 10
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect(config);
