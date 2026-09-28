const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const readStream = fs.createReadStream('uat_phase49h0.js');
    const writeStream = sftp.createWriteStream('/root/erp-boostup/backend/uat_phase49h0_exec.js');
    writeStream.on('close', () => {
      conn.exec('cd /root/erp-boostup/backend && node uat_phase49h0_exec.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('close', (code, signal) => {
          console.log(out);
          conn.exec('rm /root/erp-boostup/backend/uat_phase49h0_exec.js', () => { conn.end(); });
        }).on('data', (data) => {
          out += data.toString();
        }).stderr.on('data', (data) => {
          console.error('STDERR:', data.toString());
        });
      });
    });
    readStream.pipe(writeStream);
  });
}).connect({ host: '194.233.85.181', port: 22, username: 'root', password: 'Avario050306', readyTimeout: 10000 });
