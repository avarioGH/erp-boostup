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
import re

schema_path = 'prisma/schema.prisma'
with open(schema_path, 'r') as f:
    schema = f.read()

# Remove the bad @@unique from Company
schema = schema.replace('  @@unique([company_id, sku])\\n', '')

# Ensure Company has timberVariants TimberVariant[]
# It probably does now, let's check
if 'timberVariants TimberVariant[]' not in schema:
    schema = schema.replace('  products        Product[]', '  products        Product[]\\n  timberVariants TimberVariant[]')

# Let's insert the @@unique inside TimberVariant properly
variant_match = re.search(r'model TimberVariant \\{[\\s\\S]*?\\n\\}', schema)
if variant_match:
    variant_model = variant_match.group(0)
    
    # 1. replace productId with company_id + productId
    if 'company_id      String' not in variant_model:
        variant_model = variant_model.replace('  productId       String                   @db.ObjectId', 
                            '  company_id      String                   @db.ObjectId\\n  company         Company                  @relation(fields: [company_id], references: [id])\\n  productId       String                   @db.ObjectId')
    
    # 2. replace sku String @unique
    if 'sku             String                   @unique' in variant_model:
        variant_model = variant_model.replace('  sku             String                   @unique', '  sku             String')
    
    # 3. Add @@unique at the end of the block
    if '@@unique([company_id, sku])' not in variant_model:
        variant_model = variant_model[:-1] + '  @@unique([company_id, sku])\\n}'
        
    schema = schema[:variant_match.start()] + variant_model + schema[variant_match.end():]

with open(schema_path, 'w') as f:
    f.write(schema)
`;

  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    
    cat << 'EOF' > patch2.py
${pyCode}
EOF
    python3 patch2.py
    
    echo "=== RUNNING PRISMA GENERATE ==="
    npx prisma generate
    
    echo "=== RUNNING PRISMA DB PUSH ==="
    npx prisma db push --accept-data-loss
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
