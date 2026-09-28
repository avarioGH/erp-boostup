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
    cd /root/erp-boostup/frontend/src/app/inventory/master-data || exit 1
    ls -l species
    ls -l grade
    ls -l source
    ls -l location
    
    cd /root/erp-boostup/frontend/src/app/inventory/sawn-timber/output
    grep -n -C 5 "Grade" create/page.tsx 2>/dev/null
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
