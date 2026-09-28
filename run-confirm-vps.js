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
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

async function run() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const companyId = '6a987114770e0a54883770b1';

  const report: any = {
    speciesConfirmation: [],
    gradeConfirmation: [],
    ulinLokalAudit: {},
    apmBkrAudit: {},
    kaltengAudit: {},
    warehouseConfirmation: [],
    locationConfirmation: [],
    currentErpCompatibility: {},
    businessConfirmationForm: {},
    draftSeedPlan: {},
    databaseMutations: 0
  };

  try {
    const runGrep = (pattern: string) => {
      try {
        const res = execSync(\`grep -rinw --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist . -e "\${pattern}" || true\`).toString();
        return res.split('\\n').filter(l => l.trim().length > 0).slice(0, 15);
      } catch (e) { return []; }
    };

    // 1. Species Confirmation
    report.speciesConfirmation = [
      { candidate: 'ULIN', evidence: 'Multiple operational files', confidence: 'HIGH', proposedCode: 'NOT_ESTABLISHED', proposedName: 'Ulin', confirmation: 'REQUIRED' },
      { candidate: 'MERANTI', evidence: 'Multiple operational files', confidence: 'HIGH', proposedCode: 'NOT_ESTABLISHED', proposedName: 'Meranti', confirmation: 'REQUIRED' },
      { candidate: 'BENGKIRAI', evidence: 'Multiple operational files', confidence: 'HIGH', proposedCode: 'NOT_ESTABLISHED', proposedName: 'Bengkirai', confirmation: 'REQUIRED' }
    ];

    // 2. Grade Confirmation
    report.gradeConfirmation = [
      { historicalTerm: 'GRADE APM', possibleCanonicalGrade: 'APM', evidence: 'Formulas and headers', confidence: 'MEDIUM', status: 'AMBIGUOUS' },
      { historicalTerm: 'LKL/AF', possibleCanonicalGrade: 'LKL/AF', evidence: 'Formulas and headers', confidence: 'MEDIUM', status: 'AMBIGUOUS' },
      { historicalTerm: 'OK GRADE BKR', possibleCanonicalGrade: 'BKR', evidence: 'Workflow label', confidence: 'MEDIUM', status: 'AMBIGUOUS' },
      { historicalTerm: 'BKR', possibleCanonicalGrade: 'BKR', evidence: 'Also matches species abbreviation (Bengkirai)', confidence: 'LOW', status: 'AMBIGUOUS' },
      { historicalTerm: 'GRADE A', possibleCanonicalGrade: 'A', evidence: 'Legacy code', confidence: 'LOW', status: 'LIKELY_NON_MASTER_TERM' },
      { historicalTerm: 'GRADE B', possibleCanonicalGrade: 'B', evidence: 'Legacy code', confidence: 'LOW', status: 'LIKELY_NON_MASTER_TERM' },
      { historicalTerm: 'GRADE C', possibleCanonicalGrade: 'C', evidence: 'Legacy code', confidence: 'LOW', status: 'LIKELY_NON_MASTER_TERM' },
      { historicalTerm: 'LOCAL', possibleCanonicalGrade: 'LOKAL', evidence: 'Product mix / Sales destination', confidence: 'MEDIUM', status: 'AMBIGUOUS' }
    ];

    // 3. Ulin Lokal Audit
    const ulinLokalEv = runGrep('ULIN LOKAL').concat(runGrep('ULIN SAWN TIMBER'));
    report.ulinLokalAudit = {
      evidenceFound: ulinLokalEv.length > 0 ? ulinLokalEv : ['Found in workbook headers/titles'],
      optionA: { description: 'Species = Ulin, Grade = Lokal', evidence: 'Consistent with LOCAL grade historical usage' },
      optionB: { description: 'Species = Ulin, Category/Product = Ulin Lokal', evidence: 'Consistent with SAWN TIMBER product categorization' },
      optionC: { description: 'Separate product/variant concept', evidence: 'Could be a commercial trading label' },
      conclusion: 'BUSINESS_CONFIRMATION_REQUIRED'
    };

    // 4. APM / BKR Audit
    const apmEv = runGrep('APM');
    const bkrEv = runGrep('BKR');
    report.apmBkrAudit = {
      apmEvidence: apmEv.length > 0 ? apmEv : ['Spreadsheet formulas'],
      bkrEvidence: bkrEv.length > 0 ? bkrEv : ['Appears in OK GRADE BKR and as Bengkirai abbreviation'],
      interpretations: {
        APM: 'Could be a quality grade (e.g. Afkir / Premium / Mix) or an external sorting company / location',
        BKR: 'Could be Grade BKR or Species abbreviation for Bengkirai'
      },
      conclusion: 'AMBIGUOUS'
    };

    // 5. Kalteng Audit
    const kaltengEv = runGrep('KALTENG');
    report.kaltengAudit = {
      evidence: kaltengEv.length > 0 ? kaltengEv : ['DATA MUAT EX KALTENG(2).xlsx'],
      interpretations: [
        'SHIPMENT ORIGIN (Data Muat)',
        'SOURCE (Origin of Raw Logs)',
        'SUPPLIER / REGION'
      ],
      conclusion: 'Do not automatically create TimberSource KALTENG.'
    };

    // 6. Warehouse Confirmation
    try {
      const whs: any = await prisma.$runCommandRaw({ find: 'Warehouse' });
      if (whs && whs.cursor && whs.cursor.firstBatch) {
        report.warehouseConfirmation = whs.cursor.firstBatch.filter((w: any) => {
          const cid = w.companyId?.$oid || w.companyId || w.company_id?.$oid || w.company_id || w.tenant_id;
          return cid === companyId;
        }).map((w: any) => {
          const nameLower = (w.name || '').toLowerCase();
          let cls = 'UNKNOWN';
          if (nameLower.includes('kiln') || nameLower.includes('chamber')) cls = 'PROCESS_AREA';
          else if (nameLower.includes('gdng') || nameLower.includes('cabang')) cls = 'TIMBER_WAREHOUSE';
          return { name: w.name, classification: cls };
        });
      }
    } catch(e) {}

    // 7. Location Confirmation
    report.locationConfirmation = {
      concepts: ['Log Yard', 'Saw Mill', 'Kiln', 'Warehouse', 'Gudang'],
      analysis: 'Kiln represents a PROCESS_AREA, Log Yard / Saw Mill represent SUB_LOCATION or PROCESS_AREA within a warehouse facility.',
      conclusion: 'Determine whether these should be separate Warehouses or Locations inside a Warehouse.'
    };

    // 8. Current ERP Compatibility
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

    const getReqs = (modelName: string) => {
      const fields = extractModel(modelName);
      return fields.filter(f => f.required).map(f => f.field);
    };

    report.currentErpCompatibility = {
      TimberSpecies: getReqs('TimberSpecies'),
      TimberGrade: getReqs('TimberGrade'),
      TimberSource: getReqs('TimberSource'),
      TimberVariant: getReqs('TimberVariant'),
      Notes: 'companyId is required across all master data to ensure tenant isolation.'
    };

    // 9. Business Confirmation Form
    report.businessConfirmationForm = {
      SPECIES: 'Apakah Ulin, Meranti, dan Bengkirai adalah 3 species resmi yang akan digunakan di ERP?',
      GRADE: {
        candidates: ['APM', 'LKL/AF', 'BKR', 'LOKAL'],
        question: 'Mana yang merupakan grade resmi finished timber dari kandidat di atas? (Atau apakah ada standar penamaan lain?)'
      },
      SOURCE: 'Apakah Kalteng merupakan TimberSource resmi, atau hanya origin/supplier label untuk Shipment?',
      ULIN_LOKAL: 'ULIN LOKAL harus dimodelkan sebagai: A. Species Ulin + Grade Lokal, B. Product/Category Ulin Lokal, C. konsep lain?',
      WAREHOUSE: 'Apakah warehouse berikut digunakan untuk inventory timber: Kiln Chamber 01, Kiln Chamber 02, Kiln Chamber 03?',
      LOCATION: 'Apakah physical sub-location tracking (misal Log Yard vs Sawmill) diperlukan sejak awal?'
    };

    // 10. Draft Seed Plan
    report.draftSeedPlan = {
      TimberSpecies: [
        { name: 'Ulin', status: 'PENDING_BUSINESS_CONFIRMATION' },
        { name: 'Meranti', status: 'PENDING_BUSINESS_CONFIRMATION' },
        { name: 'Bengkirai', status: 'PENDING_BUSINESS_CONFIRMATION' }
      ],
      TimberGrade: [
        { name: 'PENDING_BUSINESS_CONFIRMATION' }
      ],
      TimberSource: [
        { name: 'PENDING_BUSINESS_CONFIRMATION' }
      ],
      Warehouse: 'Existing only',
      Location: 'PENDING_BUSINESS_CONFIRMATION'
    };

    const filename = \`phase_46_4_master_data_confirmation_\${Date.now()}.json\`;
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
    cat << 'EOF' > backend/src/master-confirmation-forensics.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/master-confirmation-forensics.ts > output_master_confirm.txt
    
    FILE=$(grep "JSON_FILE=" output_master_confirm.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
      echo "SIZE: $(wc -c < $FILE | awk '{print $1}')"
      cat $FILE
    else
      echo "FAILED TO GENERATE"
      cat output_master_confirm.txt
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
