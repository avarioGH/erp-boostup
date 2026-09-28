const { Client } = require('ssh2');

const config = {
  host: '194.233.85.181',
  port: 22,
  username: 'root',
  password: 'Avario050306',
  readyTimeout: 30000
};

const pyCode = `
import os

# 1. Patch sawn-timber.service.ts
sawn_file = 'src/inventory/sawn-timber.service.ts'
with open(sawn_file, 'r') as f:
    sawn = f.read()

if 'company_id_sku' not in sawn:
    sawn = sawn.replace('let variant = await this.prisma.timberVariant.findUnique({ where: { sku } });',
                        'let variant = await this.prisma.timberVariant.findUnique({ where: { company_id_sku: { company_id: companyId, sku } } });')
    sawn = sawn.replace('data: { productId: product.id, sku,',
                        'data: { company_id: companyId, productId: product.id, sku,')
    with open(sawn_file, 'w') as f:
        f.write(sawn)
    print('Patched sawn-timber.service.ts')

# 2. Patch import.service.ts
import_file = 'src/inventory/import/import.service.ts'
with open(import_file, 'r') as f:
    imp = f.read()

if 'company_id_sku' not in imp:
    imp = imp.replace('let variant = await tx.timberVariant.findUnique({ where: { sku } });',
                      'let variant = await tx.timberVariant.findUnique({ where: { company_id_sku: { company_id: companyId, sku } } });')
    imp = imp.replace('data: { productId: masterProd.id, sku,',
                      'data: { company_id: companyId, productId: masterProd.id, sku,')
    with open(import_file, 'w') as f:
        f.write(imp)
    print('Patched import.service.ts')
`;

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > patch_ts.py
${pyCode}
EOF
    python3 patch_ts.py
    npx tsc --noEmit
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
