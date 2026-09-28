const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    sftp.fastPut('histAudit.js', '/root/erp-boostup/backend/histAudit.js', (err) => {
      conn.exec('cd /root/erp-boostup/backend && node histAudit.js', (err, stream) => {
        let out = '';
        stream.on('close', () => { console.log(out); conn.end(); })
        .on('data', d => out += d.toString())
        .stderr.on('data', d => out += d.toString());
      });
    });
  });
}).connect({ host: '194.233.85.181', port: 22, username: 'root', password: 'Avario050306', readyTimeout: 10000 });
