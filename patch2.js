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
const path = './src/inventory/sawn-timber.service.ts';
let code = fs.readFileSync(path, 'utf8');

// FIX Phase 47.5.3b regression
code = code.replace(/where: { sku } }/g, 'where: { company_id_sku: { company_id: companyId, sku } }');
code = code.replace(/productId: product.id,/g, 'company_id: companyId,\\n          productId: product.id,');

fs.writeFileSync(path, code);
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > patch2.js
${js}
EOF
    node patch2.js
    npx tsc --noEmit
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
