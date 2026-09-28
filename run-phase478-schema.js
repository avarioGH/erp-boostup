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
    cat /root/erp-boostup/backend/prisma/schema.prisma | grep -A 20 "model RawLog"
    echo "======================================"
    cat /root/erp-boostup/backend/prisma/schema.prisma | grep -A 20 "model InputLog"
    echo "======================================"
    cat /root/erp-boostup/backend/prisma/schema.prisma | grep -A 20 "model SawnTimberOutput"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
