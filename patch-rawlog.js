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
let code = fs.readFileSync('./src/inventory/raw-log.service.ts', 'utf8');

code = code.replace(
  /speciesId: data\\.speciesId \\|\\| null,/g,
  'timberSpecies: data.speciesId ? { connect: { id: data.speciesId } } : undefined,\\n        sourceId: undefined,' // just testing if timberSpecies works and dropping sourceId for now to avoid the same error if sourceId has it
);

fs.writeFileSync('./src/inventory/raw-log.service.ts', code);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > patch-rawlog.js
${js}
EOF
    node patch-rawlog.js
    npx tsc --noEmit
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
