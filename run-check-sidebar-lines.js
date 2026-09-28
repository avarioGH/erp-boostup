const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 20000
};

conn.on('ready', () => {
  // Read the sidebar file and show me exactly what happened
  conn.exec(`sed -n '240,260p' /root/erp-boostup/frontend/src/components/app-sidebar.tsx`, (err, stream) => {
    if (err) throw err;
    let content = '';
    stream.on('data', d => { content += d.toString(); });
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => {
      console.log(JSON.stringify(content));
      conn.end();
    });
  });
}).connect(config);
