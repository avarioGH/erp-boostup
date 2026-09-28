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
    
    echo "=== FIND MASTER FILES ==="
    find backend/src -type d -name "master*" -o -name "*species*" -o -name "*grade*"
    
    echo "=== CHECK INVENTORY VARIANT ==="
    ls -l backend/src/inventory/timber-variant || echo "NO TIMBER VARIANT FOLDER"
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
