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
    cd /root/erp-boostup/backend || exit 1
    sed -i 's/s.quantityPcs/s.currentPcs/g' run-phase478-uat.ts
    sed -i 's/s.volumeM3/s.currentVolumeM3/g' run-phase478-uat.ts
    npx ts-node run-phase478-uat.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
