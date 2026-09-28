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

schema_path = 'prisma/schema.prisma'
with open(schema_path, 'r') as f:
    schema = f.read()

# 1. Company relation
if 'timberVariants TimberVariant[]' not in schema:
    schema = schema.replace('  products        Product[]', '  products        Product[]\\n  timberVariants TimberVariant[]')

# 2. TimberVariant fields
if 'company_id      String                   @db.ObjectId' not in schema:
    schema = schema.replace('  productId       String                   @db.ObjectId', 
                            '  company_id      String                   @db.ObjectId\\n  company         Company                  @relation(fields: [company_id], references: [id])\\n  productId       String                   @db.ObjectId')

# 3. sku unique
schema = schema.replace('  sku             String                   @unique', '  sku             String')

# 4. @@unique
if '@@unique([company_id, sku])' not in schema:
    schema = schema.replace('  timberStockReservations TimberStockReservation[]\\n}', 
                            '  timberStockReservations TimberStockReservation[]\\n\\n  @@unique([company_id, sku])\\n}')

with open(schema_path, 'w') as f:
    f.write(schema)


# 5. Patch sawn-timber.service.ts
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


# 6. Patch import.service.ts
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

print('Patching complete.')
`;

  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    
    cat << 'EOF' > patch.py
${pyCode}
EOF
    python3 patch.py
    
    echo "=== RUNNING PRISMA GENERATE ==="
    npx prisma generate
    
    echo "=== RUNNING PRISMA DB PUSH ==="
    # MongoDB does not support prisma migrate dev. db push is the safe schema apply method.
    npx prisma db push --accept-data-loss
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
