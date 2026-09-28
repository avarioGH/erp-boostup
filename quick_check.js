const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('grep -n -A 15 "^model Unit " /root/erp-boostup/backend/prisma/schema.prisma | head -20', (err, stream) => {
    let out = '';
    stream.on('close', () => { console.log(out); conn.end(); })
    .on('data', d => out += d.toString())
    .stderr.on('data', d => console.error(d.toString()));
  });
}).connect({ host: '194.233.85.181', port: 22, username: 'root', password: 'Avario050306', readyTimeout: 10000 });
