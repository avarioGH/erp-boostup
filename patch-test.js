const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const js = `
const fs = require('fs');
let code = fs.readFileSync('test-4782.ts', 'utf8');

code = code.replace(/rawLogService.create\\(/g, 'rawLogService.createRawLog(');
code = code.replace(/inputLogService.create\\(/g, 'inputLogService.createInputLog(');

fs.writeFileSync('test-4782.ts', code);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > patch-test.js
${js}
EOF
    node patch-test.js
    npx ts-node test-4782.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
