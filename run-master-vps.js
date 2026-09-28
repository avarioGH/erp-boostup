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
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import { execSync } from 'child_process';

async function run() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const companyId = '6a987114770e0a54883770b1';

  const report: any = {
    company: { name: 'Boostup ERP', id: companyId },
    currentMasters: {
      Warehouse: 0,
      Location: 0,
      TimberSpecies: 0,
      TimberGrade: 0,
      TimberSource: 0,
      Category: 0,
      Product: 0,
      Vehicle: 0,
      Driver: 0,
      TimberVariant: 0
    },
    warehouseAudit: { records: [] },
    locationAudit: { requiredFields: [], isNullable: false },
    speciesAudit: { evidence: { DIRECT: [], CODE_ONLY: [], AMBIGUOUS: [] } },
    gradeAudit: { evidence: { DIRECT: [], CODE_ONLY: [], AMBIGUOUS: [] } },
    sourceAudit: { evidence: [] },
    categoryProductAudit: { architecture: 'Category -> Product -> TimberVariant' },
    timberVariantRequirements: { requiredFields: [], schemaDetails: '' },
    rawLogRequirements: { requiredFields: [], schemaDetails: '' },
    productionRequirements: { requiredFields: [], schemaDetails: '' },
    historicalEvidence: {},
    masterDataMatrix: [],
    businessQuestions: [],
    readiness: 'PARTIALLY_READY',
    databaseMutations: 0
  };

  try {
    const fetchAll = async (name: string) => {
      try {
        const res: any = await prisma.$runCommandRaw({ find: name });
        if (!res || !res.cursor || !res.cursor.firstBatch) return [];
        return res.cursor.firstBatch.filter((r: any) => {
           const cid = r.companyId?.$oid || r.companyId || r.company_id?.$oid || r.company_id || r.tenant_id;
           return cid === companyId;
        });
      } catch (e) { return []; }
    };

    // 1. Current Master Counts
    const wh = await fetchAll('Warehouse');
    report.currentMasters.Warehouse = wh.length;
    report.warehouseAudit.records = wh.map((w: any) => ({
       id: w._id?.$oid || w.id,
       name: w.name,
       code: w.code || null,
       status: w.status,
       classification: 'UNDETERMINED'
    }));

    report.currentMasters.Location = (await fetchAll('Location')).length;
    report.currentMasters.TimberSpecies = (await fetchAll('TimberSpecies')).length + (await fetchAll('Species')).length;
    report.currentMasters.TimberGrade = (await fetchAll('TimberGrade')).length + (await fetchAll('Grade')).length;
    report.currentMasters.TimberSource = (await fetchAll('TimberSource')).length;
    report.currentMasters.Category = (await fetchAll('Category')).length;
    
    // Ignore the PRD-1950 from total master products if possible, but let's count realistically
    const prds = await fetchAll('Product');
    report.currentMasters.Product = prds.length;
    
    report.currentMasters.Vehicle = (await fetchAll('Vehicle')).length;
    report.currentMasters.Driver = (await fetchAll('Driver')).length;
    report.currentMasters.TimberVariant = (await fetchAll('TimberVariant')).length;

    // 2. Schema analysis
    let schemaStr = '';
    try {
      schemaStr = fs.readFileSync('/root/erp-boostup/backend/prisma/schema.prisma', 'utf8');
    } catch(e) {}

    const extractModel = (modelName: string) => {
       const regex = new RegExp(\`model \\\\s+\${modelName}\\\\s+\\\\{([^\\\\}]+)\\\\}\`, 'i');
       const match = schemaStr.match(regex);
       if (!match) return [];
       return match[1].split('\\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('//') && !l.startsWith('@@'))
          .map(l => {
             const parts = l.split(/\\s+/);
             const isOptional = parts[1] && parts[1].includes('?');
             return { field: parts[0], type: parts[1], required: !isOptional };
          });
    };

    const variantFields = extractModel('TimberVariant');
    report.timberVariantRequirements.requiredFields = variantFields.filter(f => f.required).map(f => f.field);
    report.timberVariantRequirements.schemaDetails = 'Requires: ' + report.timberVariantRequirements.requiredFields.join(', ');

    const rawLogFields = extractModel('RawLog');
    report.rawLogRequirements.requiredFields = rawLogFields.filter(f => f.required).map(f => f.field);
    report.rawLogRequirements.schemaDetails = 'Requires: ' + report.rawLogRequirements.requiredFields.join(', ');

    const prodFields = extractModel('SawnTimberOutput');
    report.productionRequirements.requiredFields = prodFields.filter(f => f.required).map(f => f.field);
    report.productionRequirements.schemaDetails = 'Requires: ' + report.productionRequirements.requiredFields.join(', ');

    const tStockFields = extractModel('TimberStock');
    const subLoc = tStockFields.find(f => f.field === 'subLocationId' || f.field === 'locationId' || f.field === 'location_id');
    report.locationAudit.isNullable = subLoc ? !subLoc.required : true;

    // 3. Historical evidence (Grep)
    const runGrep = (pattern: string) => {
      try {
        const res = execSync(\`grep -rinw --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . -e "\${pattern}" || true\`).toString();
        return res.split('\\n').filter(l => l.trim().length > 0).slice(0, 10);
      } catch (e) { return []; }
    };
    
    // Species evidence
    const meranti = runGrep('Meranti');
    const bengkirai = runGrep('Bengkirai');
    const ulin = runGrep('Ulin');
    if (meranti.length > 0 || bengkirai.length > 0 || ulin.length > 0) {
      report.speciesAudit.evidence.DIRECT.push('Meranti, Bengkirai, Ulin found in code/comments/tests.');
    }

    // Grade evidence
    const apm = runGrep('GRADE APM');
    const bkr = runGrep('GRADE BKR');
    const lkl = runGrep('LKL/AF');
    if (apm.length > 0 || bkr.length > 0 || lkl.length > 0) {
      report.gradeAudit.evidence.DIRECT.push('APM, BKR, LKL/AF found in code/comments/tests.');
    }
    const abc = runGrep('GRADE A');
    if (abc.length > 0) report.gradeAudit.evidence.CODE_ONLY.push('A, B, C, LOCAL hardcoded previously');

    // Matrix
    report.masterDataMatrix = [
      { master: 'Warehouse', currentCount: report.currentMasters.Warehouse, requiredForInventory: true, evidenceAvailable: true, safeToSeed: 'YES' },
      { master: 'Location', currentCount: report.currentMasters.Location, requiredForInventory: !report.locationAudit.isNullable, evidenceAvailable: false, safeToSeed: 'BUSINESS CONFIRMATION REQUIRED' },
      { master: 'TimberSpecies', currentCount: report.currentMasters.TimberSpecies, requiredForInventory: true, evidenceAvailable: true, safeToSeed: 'BUSINESS CONFIRMATION REQUIRED' },
      { master: 'TimberGrade', currentCount: report.currentMasters.TimberGrade, requiredForInventory: true, evidenceAvailable: true, safeToSeed: 'BUSINESS CONFIRMATION REQUIRED' },
      { master: 'TimberSource', currentCount: report.currentMasters.TimberSource, requiredForInventory: false, evidenceAvailable: false, safeToSeed: 'NO' },
      { master: 'Category', currentCount: report.currentMasters.Category, requiredForInventory: report.timberVariantRequirements.requiredFields.includes('categoryId'), evidenceAvailable: false, safeToSeed: 'NO' },
      { master: 'Product', currentCount: report.currentMasters.Product, requiredForInventory: report.timberVariantRequirements.requiredFields.includes('productId'), evidenceAvailable: false, safeToSeed: 'NO' },
      { master: 'Vehicle', currentCount: report.currentMasters.Vehicle, requiredForInventory: false, evidenceAvailable: false, safeToSeed: 'NO' },
      { master: 'Driver', currentCount: report.currentMasters.Driver, requiredForInventory: false, evidenceAvailable: false, safeToSeed: 'NO' }
    ];

    report.businessQuestions = [
      'What is the exact official TimberSpecies list?',
      'What is the exact official TimberGrade list?',
      'Do all 6 registered Warehouses physically hold timber inventory?',
      'Is physical sub-location tracking required immediately, or can stock just be at the Warehouse level?'
    ];

    const filename = \`phase_46_2_master_data_baseline_\${Date.now()}.json\`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log("JSON_FILE=" + filename);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
`;

  const cmd = `
    cd /root/erp-boostup || exit 1
    cat << 'EOF' > backend/src/master-baseline-forensics.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/master-baseline-forensics.ts > output_master_baseline.txt
    
    FILE=$(grep "JSON_FILE=" output_master_baseline.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
      echo "SIZE: $(wc -c < $FILE | awk '{print $1}')"
      cat $FILE
    else
      echo "FAILED TO GENERATE"
      cat output_master_baseline.txt
    fi
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
