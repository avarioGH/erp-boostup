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
  const cmd = `
    cd /root/erp-boostup/backend || exit 1
    git checkout prisma/schema.prisma
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => {
      // Now patch properly
      const pyCode = \`
import os
import re

schema_path = 'prisma/schema.prisma'
with open(schema_path, 'r') as f:
    schema = f.read()

# 1. Update Company Model explicitly
company_match = re.search(r'model Company \\{[\\s\\S]*?\\n\\}', schema)
if company_match:
    company_model = company_match.group(0)
    if 'timberVariants TimberVariant[]' not in company_model:
        company_model = company_model.replace('  products        Product[]', '  products        Product[]\\n  timberVariants  TimberVariant[]')
    schema = schema[:company_match.start()] + company_model + schema[company_match.end():]

# 2. Update TimberVariant Model explicitly
variant_match = re.search(r'model TimberVariant \\{[\\s\\S]*?\\n\\}', schema)
if variant_match:
    variant_model = variant_match.group(0)
    
    if 'company_id      String' not in variant_model:
        variant_model = variant_model.replace('  productId       String                   @db.ObjectId', 
                            '  company_id      String                   @db.ObjectId\\n  company         Company                  @relation(fields: [company_id], references: [id])\\n  productId       String                   @db.ObjectId')
    
    if 'sku             String                   @unique' in variant_model:
        variant_model = variant_model.replace('  sku             String                   @unique', '  sku             String')
    
    if '@@unique([company_id, sku])' not in variant_model:
        variant_model = variant_model[:-1] + '  @@unique([company_id, sku])\\n}'
        
    schema = schema[:variant_match.start()] + variant_model + schema[variant_match.end():]

with open(schema_path, 'w') as f:
    f.write(schema)
\`;
      conn.exec(\`cd /root/erp-boostup/backend && cat << 'EOF' > patch3.py\n\${pyCode}\nEOF\npython3 patch3.py && npx prisma generate && npx prisma db push --accept-data-loss\`, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
      });
    });
  });
}).connect(config);
