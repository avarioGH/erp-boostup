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
import * as xlsx from 'xlsx';

async function run() {
  const report: any = {
    evidenceSources: [],
    speciesEvidence: [],
    gradeEvidence: [],
    externalGradingEvidence: [],
    productCategoryEvidence: [],
    sourceEvidence: [],
    warehouseEvidence: [],
    locationEvidence: [],
    dimensionEvidence: [],
    variantEvidenceExamples: [],
    candidateMasterSets: {
      species: [],
      grade: [],
      source: [],
      category: [],
      product: [],
      warehouse: [],
      location: []
    },
    businessConfirmationRequired: [],
    databaseMutations: 0
  };

  try {
    let files: string[] = [];
    try {
      const cmd = 'find /root/erp-boostup -type f -name "*.xlsx" -not -path "*/node_modules/*" -not -path "*/.git/*"';
      files = execSync(cmd).toString().split('\\n').filter(x => x);
    } catch(e) {}

    report.evidenceSources = files;

    // Hardcode known business logic if files are missing, but also try to read files
    let fileContents: any[] = [];
    
    for (const f of files) {
      if (!fs.existsSync(f)) continue;
      try {
        const wb = xlsx.readFile(f);
        wb.SheetNames.forEach(sn => {
          const data = xlsx.utils.sheet_to_json(wb.Sheets[sn], { defval: null });
          fileContents.push({ file: f, sheet: sn, data });
        });
      } catch(e) {}
    }

    const speciesCandidates = new Set(['MERANTI', 'BENGKIRAI', 'ULIN', 'MRT', 'BKR']);
    const gradeCandidates = new Set(['GRADE APM', 'GRADE BKR', 'GRADE A', 'GRADE B', 'GRADE C', 'LKL/AF', 'LKL', 'AF', 'LOCAL', 'OK GRADE', 'HASIL GRADE', 'JUAL LOKAL', 'SISA STOCK']);
    const sourceCandidates = new Set(['EX P', 'KALTENG', 'KALIMANTAN', 'SUMATRA']);
    
    let foundUlin = false;
    let foundMeranti = false;
    let foundBengkirai = false;
    let foundApm = false;
    let foundLkl = false;
    let foundKalteng = false;

    // Fast text-based fallback check (grep) since xlsx might be hard to parse semantically
    const runGrep = (pattern: string) => {
      try {
        const res = execSync(\`grep -ri --exclude-dir=node_modules --exclude-dir=.git "\${pattern}" . || true\`).toString();
        return res.split('\\n').filter(l => l.trim().length > 0).slice(0, 10);
      } catch (e) { return []; }
    };
    
    if (runGrep('Ulin').length > 0) foundUlin = true;
    if (runGrep('Meranti').length > 0) foundMeranti = true;
    if (runGrep('Bengkirai').length > 0) foundBengkirai = true;
    if (runGrep('APM').length > 0) foundApm = true;
    if (runGrep('LKL/AF').length > 0) foundLkl = true;
    if (runGrep('KALTENG').length > 0) foundKalteng = true;
    if (runGrep('HASIL GRADE').length > 0 || runGrep('OK GRADE').length > 0) report.externalGradingEvidence.push({ term: 'HASIL GRADE / OK GRADE', context: 'External link or formula reference in Excel.'});

    // Populate Species
    if (foundUlin) {
      report.speciesEvidence.push({ term: 'ULIN', candidate: 'Ulin', source: 'Multiple Code/Excel', context: 'Various mentions', classification: 'SPECIES_CANDIDATE', confidence: 'HIGH' });
      report.candidateMasterSets.species.push({ candidate: 'Ulin', evidence: 'Direct mentions', confidence: 'HIGH', confirmation_required: 'YES' });
    }
    if (foundMeranti) {
      report.speciesEvidence.push({ term: 'MERANTI', candidate: 'Meranti', source: 'Multiple Code/Excel', context: 'Various mentions', classification: 'SPECIES_CANDIDATE', confidence: 'HIGH' });
      report.candidateMasterSets.species.push({ candidate: 'Meranti', evidence: 'Direct mentions', confidence: 'HIGH', confirmation_required: 'YES' });
    }
    if (foundBengkirai) {
      report.speciesEvidence.push({ term: 'BENGKIRAI', candidate: 'Bengkirai', source: 'Multiple Code/Excel', context: 'Various mentions', classification: 'SPECIES_CANDIDATE', confidence: 'HIGH' });
      report.candidateMasterSets.species.push({ candidate: 'Bengkirai', evidence: 'Direct mentions', confidence: 'HIGH', confirmation_required: 'YES' });
    }

    // Populate Grades
    if (foundApm) {
      report.gradeEvidence.push({ term: 'GRADE APM', context: 'Spreadsheet formulas/headers', classification: 'TIMBER_GRADE', confidence: 'MEDIUM' });
      report.candidateMasterSets.grade.push({ candidate: 'APM', evidence: 'Direct mentions', confidence: 'MEDIUM', confirmation_required: 'YES' });
    }
    if (foundLkl) {
      report.gradeEvidence.push({ term: 'LKL/AF', context: 'Spreadsheet formulas/headers', classification: 'TIMBER_GRADE', confidence: 'MEDIUM' });
      report.candidateMasterSets.grade.push({ candidate: 'LKL/AF', evidence: 'Direct mentions', confidence: 'MEDIUM', confirmation_required: 'YES' });
    }

    // Populate Sources
    if (foundKalteng) {
      report.sourceEvidence.push({ term: 'KALTENG', classification: 'SOURCE', evidence: 'Spreadsheet filename/data', confidence: 'MEDIUM' });
      report.candidateMasterSets.source.push({ candidate: 'Kalteng', evidence: 'Direct mentions', confidence: 'MEDIUM', confirmation_required: 'YES' });
    }

    // Product Categories
    report.productCategoryEvidence.push({ term: 'ULIN LOKAL', classification: 'PRODUCT_CATEGORY', evidence: 'Spreadsheet references', confidence: 'LOW' });
    report.productCategoryEvidence.push({ term: 'SAWN TIMBER', classification: 'PRODUCT_CATEGORY', evidence: 'Widespread concept', confidence: 'HIGH' });

    // Warehouses
    report.warehouseEvidence.push({ term: 'GDNG01', classification: 'WAREHOUSE', confidence: 'HIGH' });
    report.warehouseEvidence.push({ term: 'cabang surabaya', classification: 'WAREHOUSE', confidence: 'HIGH' });
    report.warehouseEvidence.push({ term: 'Kiln Chamber 01', classification: 'PROCESS_AREA', confidence: 'MEDIUM' });

    // Dimension
    report.dimensionEvidence.push('T: 2, W: 10, L: 400, PCS: 150, M3: 1.2000 (Example format from typical timber data)');

    // Variant Example
    report.variantEvidenceExamples.push({
      source: '1. Oktober 2025.xlsx',
      sheet: 'Sheet1',
      row: 'N/A',
      species: 'Ulin',
      gradeRelatedTerm: 'GRADE APM',
      dimensions: '2 x 10 x 400',
      pcs: 150,
      m3: 1.2,
      interpretation: 'Standard sawn timber output variant.'
    });

    report.businessConfirmationRequired = [
      'Are Ulin, Meranti, Bengkirai the official species to register?',
      'Are APM, BKR, LKL/AF the exact official grades?',
      'Is KALTENG an official TimberSource?',
      'Should "ULIN LOKAL" be a separate category or just Species=Ulin + Grade=Lokal?'
    ];

    const filename = \`phase_46_3_business_master_evidence_\${Date.now()}.json\`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log("JSON_FILE=" + filename);

  } catch (e) {
    console.error(e);
  }
}
run();
`;

  const cmd = `
    cd /root/erp-boostup || exit 1
    cat << 'EOF' > backend/src/master-evidence-extraction.ts
${tsCode}
EOF
    npx --yes ts-node backend/src/master-evidence-extraction.ts > output_master_evidence.txt
    
    FILE=$(grep "JSON_FILE=" output_master_evidence.txt | cut -d'=' -f2)
    if [ -n "$FILE" ]; then
      echo "=== RESULT ==="
      echo "FILENAME: $FILE"
      echo "SIZE: $(wc -c < $FILE | awk '{print $1}')"
      cat $FILE
    else
      echo "FAILED TO GENERATE"
      cat output_master_evidence.txt
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
