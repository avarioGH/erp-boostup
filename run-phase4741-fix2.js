const { Client } = require('ssh2');

const conn = new Client();
const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 15000
};

conn.on('ready', () => {
  const tsCode = `
import * as fs from 'fs';

function fixService(name, modelName) {
  const path = \`/root/erp-boostup/backend/src/inventory/master-data/services/\${name}.service.ts\`;
  if (!fs.existsSync(path)) return;
  
  let content = fs.readFileSync(path, 'utf8');
  
  // Remove the stupid comparison block in non-Location services
  if (modelName !== 'Location') {
    const regex = /if \\(data\\.warehouseId && '[a-zA-Z]+' === 'Location'\\) \\{[\\s\\S]*?\\}/g;
    content = content.replace(regex, "");
  }
  
  fs.writeFileSync(path, content);
}

function fixBatchAudit() {
  const path = '/root/erp-boostup/backend/src/inventory/reconciliation/batch-audit.service.ts';
  if (!fs.existsSync(path)) return;
  
  let content = fs.readFileSync(path, 'utf8');
  
  // TimberPurchaseItem and ProductionProcessOutput use batch_number
  content = content.replace(/batch: '\\?\\?\\?' as any \\/\\/ TO FIX TimberPurchaseItem/g, "batch_number: '???' as any"); // just matching what I might have replaced
  // Let's do it precisely for lines 302 and 307
  content = content.replace(/TimberPurchaseItem: { batch:/g, "TimberPurchaseItem: { batch_number:");
  content = content.replace(/ProductionProcessOutput: { batch:/g, "ProductionProcessOutput: { batch_number:");
  
  fs.writeFileSync(path, content);
}

function run() {
  fixService('timber-species', 'TimberSpecies');
  fixService('timber-grade', 'TimberGrade');
  fixService('timber-source', 'TimberSource');
  fixService('location', 'Location');
  
  fixBatchAudit();
}
run();
`;

  const cmd = `
    cd /root/erp-boostup || exit 1
    cat << 'EOF' > backend/src/phase4741-fix2.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/phase4741-fix2.ts
    
    echo "=== TSC CHECK ==="
    cd backend && npx tsc --noEmit
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', data => {
      process.stdout.write(data.toString());
    }).stderr.on('data', data => {
      process.stderr.write(data.toString());
    });
  });
}).connect(config);
