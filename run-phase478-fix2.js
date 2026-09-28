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
    sed -i 's/thicknessMm: 20/thickness: 20, thicknessMm: 20/g' run-phase478-uat.ts
    sed -i 's/widthMm: 100/width: 100, widthMm: 100/g' run-phase478-uat.ts
    sed -i 's/lengthMm: 4000/length: 4000, lengthMm: 4000/g' run-phase478-uat.ts
    npx ts-node run-phase478-uat.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
