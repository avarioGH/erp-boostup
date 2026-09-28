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
    cd /root/erp-boostup || exit 1
    
    echo "=== SEARCH USER DECORATOR ==="
    grep -rin "Req() req" backend/src/inventory || grep -rin "User()" backend/src/inventory | head -n 10
    
    echo "=== CHECK OTHER CONTROLLERS ==="
    cat backend/src/inventory/warehouse/warehouse.controller.ts | head -n 25 || echo "NO WAREHOUSE CONTROLLER"
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
