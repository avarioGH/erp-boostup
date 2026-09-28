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
    
    echo "=== FIND UI COMPONENTS ==="
    ls -l src/components/ui || echo "NO UI DIR"
    
    echo "=== FIND API WRAPPER ==="
    find src -type f -name "api*.ts" -o -name "fetch*.ts" | head -n 10
    
    echo "=== CHECK EXISTING ROUTES ==="
    find src/app -type d -name "master*" 
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
