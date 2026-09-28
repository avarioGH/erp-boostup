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
    
    echo "=== TSC ERRORS ==="
    npx tsc --noEmit || true
    
    echo "=== SCHEMA FIELDS ==="
    grep -i "company_id" prisma/schema.prisma | head -n 5
    grep -A 3 "model TimberSpecies" prisma/schema.prisma
    grep -A 3 "model TimberGrade" prisma/schema.prisma
    grep -A 5 "model Location" prisma/schema.prisma
    
    echo "=== JWT / USER CONVENTION ==="
    cat src/auth/jwt.strategy.ts | grep -i "company" || echo "NOT FOUND"
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
