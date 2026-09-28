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
  // Fix the two remaining lines: 302 and 307
  // TimberPurchaseItem uses batch_number, ProductionProcessOutput uses batch_number
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    
    python3 -c "
import re

with open('src/inventory/reconciliation/batch-audit.service.ts', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    ln = i + 1
    # Line 302: TimberPurchaseItem batch -> batch_number
    if ln == 302 and 'timberPurchaseItem' in line.lower() and ', batch:' in line:
        lines[i] = line.replace(', batch:', ', batch_number:')
    # Line 307: ProductionProcessOutput batch -> batch_number
    if ln == 307 and 'productionProcessOutput' in line.lower() and ', batch:' in line:
        lines[i] = line.replace(', batch:', ', batch_number:')

with open('src/inventory/reconciliation/batch-audit.service.ts', 'w') as f:
    f.writelines(lines)

print('DONE')
"
    
    echo "=== TSC FINAL ==="
    npx tsc --noEmit 2>&1
    echo "EXIT: $?"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
}).connect(config);
