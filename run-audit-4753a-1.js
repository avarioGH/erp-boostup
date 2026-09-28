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
  const tsCode = `
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== DATABASE READ-ONLY AUDIT ===');
  const totalVariants = await prisma.timberVariant.count();
  console.log('Total Variants:', totalVariants);
  
  // By company
  const variants = await prisma.timberVariant.findMany({
    include: { product: { select: { company_id: true } } }
  });
  
  const byCompany = {};
  const skuMap = {};
  let missingProduct = 0;
  let missingSpecies = 0;
  let missingGrade = 0;
  
  for (const v of variants) {
    if (!v.productId) missingProduct++;
    if (!v.speciesId) missingSpecies++;
    if (!v.gradeId) missingGrade++;
    
    const cid = v.product ? v.product.company_id : 'UNKNOWN';
    byCompany[cid] = (byCompany[cid] || 0) + 1;
    
    if (!skuMap[v.sku]) skuMap[v.sku] = [];
    skuMap[v.sku].push(cid);
  }
  
  console.log('Total by Company:', byCompany);
  console.log('Missing Product:', missingProduct);
  console.log('Missing Species:', missingSpecies);
  console.log('Missing Grade:', missingGrade);
  
  let globalDupes = 0;
  let crossCompanyDupes = 0;
  let sameCompanyDupes = 0;
  
  for (const sku in skuMap) {
    const cids = skuMap[sku];
    if (cids.length > 1) {
      globalDupes++;
      const uniqueCids = new Set(cids);
      if (uniqueCids.size > 1) {
        crossCompanyDupes++;
      } else {
        sameCompanyDupes++;
      }
    }
  }
  
  console.log('Global Duplicate SKU:', globalDupes);
  console.log('Cross-Company Duplicate SKU:', crossCompanyDupes);
  console.log('Same-Company Duplicate SKU:', sameCompanyDupes);
  
  await prisma.$disconnect();
}
main().catch(console.error);
`;

  const cmd = `
    cd /root/erp-boostup || exit 1
    
    echo "=== GREP SKU LOOKUPS IN BACKEND ==="
    grep -rn -E "findUnique.*where:.*sku|findFirst.*where:.*sku" backend/src/
    
    echo "=== GREP SKU CREATE/UPSERT IN BACKEND ==="
    grep -rn -E "create:.*sku|upsert.*where:.*sku" backend/src/
    
    cd backend
    cat << 'EOF' > db-audit.ts
${tsCode}
EOF
    npx ts-node db-audit.ts
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(config);
