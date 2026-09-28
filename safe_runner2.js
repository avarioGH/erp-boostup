const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/root/erp-boostup/backend/uat_49h3_p2.js');
    ws.on('close', () => {
      console.log('uploaded p2');
      conn.exec('cd /root/erp-boostup/backend && node uat_49h3_p2.js 2>&1', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('close', () => { console.log(out); conn.end(); })
        .on('data', d => { out += d.toString(); if (d.toString().includes('\n')) process.stdout.write('.'); })
        .stderr.on('data', d => out += d.toString());
      });
    });
    fs.createReadStream('C:/Users/Billion/.gemini/antigravity/brain/44e00d99-ee86-4b30-ac77-173455a2620c/scratch/uat_49h3_part2.js').pipe(ws);
  });
}).connect({ host: '194.233.85.181', port: 22, username: 'root', password: 'Avario050306', readyTimeout: 10000 });
