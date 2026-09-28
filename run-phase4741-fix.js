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
  
  if (modelName === 'Location') {
    // Location has no company_id, it is linked via warehouse.
    content = content.replace(/where: { companyId }/g, "where: { warehouse: { company_id: companyId } }");
    content = content.replace(/where: { id, companyId }/g, "where: { id, warehouse: { company_id: companyId } }");
    content = content.replace(/where: { companyId, code: data\\.code }/g, "where: { code: data.code, warehouse: { company_id: companyId } }");
    content = content.replace(/where: { id: data\\.warehouseId, companyId }/g, "where: { id: data.warehouseId, company_id: companyId }");
    content = content.replace(/const payload = { \\.\\.\\.data, companyId };/g, "const payload = { ...data };");
    content = content.replace(/\\('\\$\\{modelName\\}' === 'Location'\\)/g, "(true)"); // Simplify the condition
  } else {
    // TimberSpecies, TimberGrade, TimberSource
    content = content.replace(/where: { companyId }/g, "where: { company_id: companyId }");
    content = content.replace(/where: { id, companyId }/g, "where: { id, company_id: companyId }");
    content = content.replace(/where: { companyId, code: data\\.code }/g, "where: { company_id: companyId, code: data.code }");
    content = content.replace(/where: { id: data\\.warehouseId, companyId }/g, "where: { id: data.warehouseId, company_id: companyId }");
    content = content.replace(/const payload = { \\.\\.\\.data, companyId };/g, "const payload = { ...data, company_id: companyId };");
  }
  
  fs.writeFileSync(path, content);
}

function fixBatchAudit() {
  const path = '/root/erp-boostup/backend/src/inventory/reconciliation/batch-audit.service.ts';
  if (!fs.existsSync(path)) return;
  
  let content = fs.readFileSync(path, 'utf8');
  
  // Re-inject normalizeBatch at the top
  if (!content.includes('const normalizeBatch')) {
    content = content.replace(
      "import { Injectable } from '@nestjs/common';",
      "import { Injectable } from '@nestjs/common';\\nconst normalizeBatch = (b?: string | null) => b ? b.trim().toUpperCase() : 'UNKNOWN';"
    );
  }
  
  // Revert batch_number to batch everywhere
  content = content.replace(/batch_number:/g, 'batch:');
  content = content.replace(/r\\.batch_number/g, 'r.batch');
  
  fs.writeFileSync(path, content);
}

function run() {
  fixService('timber-species', 'TimberSpecies');
  fixService('timber-grade', 'TimberGrade');
  fixService('timber-source', 'TimberSource');
  fixService('location', 'Location');
  
  fixBatchAudit();
  console.log("FIX_APPLIED");
}
run();
`;

  const cmd = `
    cd /root/erp-boostup || exit 1
    cat << 'EOF' > backend/src/phase4741-fix.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/phase4741-fix.ts
    
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
