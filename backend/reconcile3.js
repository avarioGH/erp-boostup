const xlsx = require('xlsx');

const wb2 = xlsx.readFile('C:/Users/Billion/Downloads/1. Oktober 2025.xlsx');
const wb1 = xlsx.readFile('C:/Users/Billion/Downloads/13. PROD SWM ULIN AWIE.xlsx');

// Fix Output - the column mapping was wrong. Let me re-examine
const outRaw = xlsx.utils.sheet_to_json(wb2.Sheets['Output Sawn timber'], { defval: null, header: 1 });

// Row 1 are the actual column headers: TANGGAL, SHIFT, GUDANG, BUNDEL, NO.INPUT, null, PRODUK, UKURAN, QTY, M3
// Data starts row 2 (0-indexed)
// BUT looking at sample row: col5=PRODUK, col6=UKURAN means there's an extra null col

// Let's look at a few rows carefully
console.log('=== CAREFUL COLUMN MAPPING ===');
for (let i = 1; i < 6; i++) {
  if (outRaw[i]) {
    outRaw[i].forEach((val, col) => {
      if (val !== null) console.log(`  Row${i} Col${col}: ${val}`);
    });
  }
}

// So actual mapping:
// Col 0 = TANGGAL, 1 = SHIFT, 2 = GUDANG, 3 = BUNDEL, 4 = NO.INPUT (col 5 = null)
// Col 6 = PRODUK, 7 = UKURAN, 8 = QTY, 9 = M3

const outData = outRaw.slice(2).filter(r => r[3] !== null);
console.log('\nData rows:', outData.length);

// Check size format 
console.log('\nSize samples:');
for (let i = 0; i < 5; i++) {
  const row = outData[i];
  if (row) console.log(`  BUNDEL: ${row[3]}, PRODUK: ${row[6]}, UKURAN: ${row[7]}, QTY: ${row[8]}, M3: ${row[9]}`);
}

// The sizes appear to use Indonesian number format: 42,00 x 210,00 x 2.450,00
// meaning 42 x 210 x 2450 (2.450 = 2450 in Indonesian format)
function parseIndonesianSize(sizeStr) {
  if (!sizeStr) return null;
  const s = String(sizeStr).trim();
  // Indonesian format: uses . as thousands separator and , as decimal
  // e.g. "42,00 x 210,00 x 2.450,00" -> 42 x 210 x 2450
  const parts = s.split(/\s*[xX×]\s*/);
  if (parts.length !== 3) return null;
  const parseNum = (n) => {
    // Remove thousand separators (.) and replace decimal comma (,) with dot
    return parseFloat(n.replace(/\./g, '').replace(/,/g, '.'));
  };
  return parts.map(parseNum);
}

let outMatch = 0, outRounding = 0, outMismatch = 0, outParseErr = 0;
let totalExcelM3 = 0, totalErpM3 = 0;
const outMismatches = [];

outData.forEach((row) => {
  const bundel = row[3];
  const sizeStr = row[7];
  const qty = parseFloat(String(row[8] || '').replace(/[.,]/g, m => m === '.' ? '' : '.') || 0);
  const excelM3 = parseFloat(String(row[9] || '').replace(/[.,]/g, m => m === '.' ? '' : '.') || 0);
  
  if (!sizeStr || !qty) { outParseErr++; return; }
  
  const dims = parseIndonesianSize(sizeStr);
  if (!dims || dims.some(isNaN)) { outParseErr++; return; }
  
  const [t, w, l] = dims;
  const erpM3 = (t * w * l * qty) / 1000000000;
  const diff = Math.abs(erpM3 - excelM3);
  
  totalExcelM3 += excelM3;
  totalErpM3 += erpM3;
  
  if (diff < 0.0001) outMatch++;
  else if (diff < 0.005) outRounding++;
  else {
    outMismatch++;
    if (outMismatches.length < 5) {
      outMismatches.push({ bundel, size: sizeStr, parsedDims: dims, qty, excelM3, erpM3, diff: diff.toFixed(8) });
    }
  }
});

console.log('\n=== SAWN TIMBER OUTPUT M3 RECONCILIATION ===');
console.log('Total data rows:', outData.length);
console.log('Parse errors (skipped):', outParseErr);
console.log('EXACT match:', outMatch);
console.log('Rounding diff:', outRounding);
console.log('Mismatch:', outMismatch);
console.log('Total Excel M3:', totalExcelM3.toFixed(4));
console.log('Total ERP M3:', totalErpM3.toFixed(4));
console.log('Difference:', (totalErpM3 - totalExcelM3).toFixed(6));
if (outMismatches.length) console.log('Mismatches:', JSON.stringify(outMismatches, null, 2));

// ===== TRIMMING LOG RECONCILIATION =====
const trimRaw = xlsx.utils.sheet_to_json(wb1.Sheets['Trimming log'], { defval: null, header: 1 });
const trimHeaders = trimRaw[3]; 
// Row 3: CEK, NO, S, TANGGAL, NO LOG, NO TRM, KODE, JENIS, PANJANG, D1, D2, D3, D4, Ø, Ø2, Brutto, GR, M3, Trimming, Vol Tr, Netto, TGL INPUT
// Col:   0    1    2  3         4       5       6     7       8        9   10  11  12  13  14  15      16  17  18        19      20      21

const trimData = trimRaw.slice(4).filter(r => r[4] !== null && r[5] !== null);
console.log('\n=== TRIMMING LOG ===');
console.log('Total trimming rows:', trimData.length);

// Group by parent log
const parentMap = {};
trimData.forEach(row => {
  const parentLog = row[4];
  const trimNo = row[5];
  const length = parseFloat(row[8] || 0);
  if (!parentMap[parentLog]) parentMap[parentLog] = [];
  parentMap[parentLog].push({ trimNo, length });
});

console.log('Unique parent logs:', Object.keys(parentMap).length);

// Validate trim formula
let trimMatch = 0, trimRounding = 0, trimMismatch = 0;

trimData.forEach(row => {
  const d1 = row[9], d2 = row[10], d3 = row[11], d4 = row[12];
  const length = parseFloat(row[8] || 0);
  const grCm = row[16]; // GR (Gerowong in cm)
  const excelBrutto = parseFloat(row[15] || 0);
  const excelNetto = parseFloat(row[20] || 0);
  
  if (!d1 || !d2 || !d3 || !d4 || !length) return;
  
  const avgDia = (d1 + d2 + d3 + d4) / 4;
  const roundedDia = Math.round(avgDia);
  const grossM3 = Math.round(roundedDia * roundedDia * length * 0.7854 / 10000 * 100) / 100;
  
  let gerowongM3 = 0;
  if (grCm && grCm > 0) {
    gerowongM3 = Math.round(grCm * grCm * length * 0.7854 / 10000 * 100) / 100;
  }
  
  // Input log business rule: Net = Brutto - GR_M3 (not subtracting trimming separately)
  const nettoM3 = Math.round((grossM3 - gerowongM3) * 100) / 100;
  
  const brutoDiff = Math.abs(grossM3 - excelBrutto);
  const nettoDiff = Math.abs(nettoM3 - excelNetto);
  
  if (brutoDiff < 0.001 && nettoDiff < 0.001) trimMatch++;
  else if (brutoDiff < 0.01 || nettoDiff < 0.01) trimRounding++;
  else trimMismatch++;
});

console.log('Trim formula EXACT match:', trimMatch);
console.log('Trim rounding:', trimRounding);
console.log('Trim mismatch:', trimMismatch);

// ===== INPUT LOG PARSING =====
const inputRaw = xlsx.utils.sheet_to_json(wb1.Sheets['Input Log'], { defval: null, header: 1 });
// Let me find actual data header
for (let i = 0; i < 10; i++) {
  if (inputRaw[i] && inputRaw[i].some(v => v !== null)) {
    console.log(`\nInput Log Row ${i}:`, JSON.stringify(inputRaw[i] && inputRaw[i].slice(0, 12)));
  }
}
