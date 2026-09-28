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
    cat /root/erp-boostup/backend/src/inventory/raw-log.service.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let data = '';
    stream.on('data', d => { data += d.toString(); });
    stream.on('close', () => {
      require('fs').writeFileSync('vps_raw_log_service.ts', data);
      console.log('Downloaded to vps_raw_log_service.ts');
      conn.end();
    });
  });
}).connect(config);
