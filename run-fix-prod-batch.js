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
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    
    python3 << 'PYEOF'
with open('src/inventory/reconciliation/batch-audit.service.ts', 'r') as f:
    content = f.read()

# ProductionProcessOutput has no batch field at all - remove filter
content = content.replace(
    'this.prisma.productionProcessOutput.findMany({ where: { productionProcess: { company_id: companyId }, batch_number: { in: exactFilters } },',
    'this.prisma.productionProcessOutput.findMany({ where: { productionProcess: { company_id: companyId } },'
)

with open('src/inventory/reconciliation/batch-audit.service.ts', 'w') as f:
    f.write(content)

print('DONE')
PYEOF

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
