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
  const pyCode = `
import os

sawn_file = 'src/inventory/sawn-timber.service.ts'
with open(sawn_file, 'r') as f:
    sawn = f.read()

if 'company_id: companyId,\\n          productId: product.id,' not in sawn:
    sawn = sawn.replace('data: {\\n          productId: product.id,',
                        'data: {\\n          company_id: companyId,\\n          productId: product.id,')
    with open(sawn_file, 'w') as f:
        f.write(sawn)

import_file = 'src/inventory/import/import.service.ts'
with open(import_file, 'r') as f:
    imp = f.read()

imp = imp.replace('company_id_sku: { company_id: companyId, sku }',
                  'company_id_sku: { company_id: dummyCompany.id, sku }')
imp = imp.replace('data: { company_id: companyId, productId: masterProd.id',
                  'data: { company_id: dummyCompany.id, productId: masterProd.id')

if 'data: { productId: masterProd.id, sku,' in imp:
    imp = imp.replace('data: { productId: masterProd.id, sku,',
                      'data: { company_id: dummyCompany.id, productId: masterProd.id, sku,')

with open(import_file, 'w') as f:
    f.write(imp)
`;

  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    cat << 'EOF' > patch4.py
${pyCode}
EOF
    python3 patch4.py
    npx tsc --noEmit
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
