const xlsx = require('xlsx');
const wb2 = xlsx.readFile('C:/Users/Billion/Downloads/1. Oktober 2025.xlsx');
const wb1 = xlsx.readFile('C:/Users/Billion/Downloads/13. PROD SWM ULIN AWIE.xlsx');

// Fix: xlsx parses Indonesian number format string "42,00 x 210,00 x 2.450,00" correctly from cell type 's'
// The M3 cell J3 = 0.5186 (type n) which IS correct.
// Problem was in reconcile3: parseFloat on Indonesian number format with comma-as-decimal

function parseIndonesianNumber(val) {
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  // Indonesian format: 1.234,56 -> 1234.56, 0,5186 -> 0.5186
  // Remove thousand separators (.), replace decimal comma with dot
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
}

function parseIndonesianSize(sizeStr) {
  if (!sizeStr) return null;
  const s = String(sizeStr).trim();
  const parts = s.split(/\s*[xX×]\s*/);
  if (parts.length !== 3) return null;
  return parts.map(p => {
    // e.g. "2.450,00" -> 2450, "42,00" -> 42
    return parseFloat(p.replace(/\./g, '').replace(',', '.'));
  });
}

// ===== SAWN TIMBER OUTPUT M3 RECONCILIATION =====
const outRaw = xlsx.utils.sheet_to_json(wb2.Sheets['Output Sawn timber'], { defval: null, header: 1 });
// Headers at row 1, data at row 2+
// Col: 0=TANGGAL, 1=SHIFT, 2=GUDANG, 3=BUNDEL, 4=NO.INPUT, 5=null, 6=PRODUK, 7=UKURAN, 8=QTY, 9=M3
const outData = outRaw.slice(2).filter(r => r[3] !== null && r[7] !== null);

let outMatch = 0, outRounding = 0, outMismatch = 0, outParseErr = 0;
let totalExcelM3 = 0, totalErpM3 = 0;
const outMismatches = [];
let bundleSet = new Set();
let duplicateBundles = 0;

outData.forEach((row) => {
  const bundel = row[3];
  const sizeStr = row[7];
  const qty = typeof row[8] === 'number' ? row[8] : parseIndonesianNumber(row[8]);
  const excelM3 = typeof row[9] === 'number' ? row[9] : parseIndonesianNumber(row[9]);
  
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
    if (outMismatches.length < 5) outMismatches.push({ bundel, size: sizeStr, dims, qty, excelM3, erpM3, diff: diff.toFixed(8) });
  }
  
  bundleSet.add(bundel);
});

const uniqueBundles = bundleSet.size;

console.log('=== SAWN TIMBER OUTPUT M3 RECONCILIATION ===');
console.log('Total data rows (line items):', outData.length);
console.log('Unique bundles:', uniqueBundles);
console.log('Parse errors (skipped):', outParseErr);
console.log('EXACT match:', outMatch);
console.log('Rounding diff (<0.005):', outRounding);
console.log('Mismatch:', outMismatch);
console.log('Total Excel M3:', totalExcelM3.toFixed(6));
console.log('Total ERP M3:', totalErpM3.toFixed(6));
console.log('Difference:', Math.abs(totalErpM3 - totalExcelM3).toFixed(6));
console.log('VERDICT:', Math.abs(totalErpM3 - totalExcelM3) < 0.01 ? 'PASS' : 'MISMATCH');
if (outMismatches.length) {
  console.log('Sample mismatches:');
  outMismatches.forEach(m => console.log(JSON.stringify(m)));
}

// ===== RAW LOG RECONCILIATION (already passed, but summarize) =====
const dukbRaw = xlsx.utils.sheet_to_json(wb1.Sheets['DUKB'], { defval: null, header: 1 });
const dukbRows = dukbRaw.slice(5).filter(r => r[0] !== null && typeof r[0] === 'number');
let rawMatch = 0, rawMismatch = 0, totalDukbNet = 0, totalDukbGross = 0;

dukbRows.forEach(row => {
  const d1 = row[6], d2 = row[7], d3 = row[8], d4 = row[9];
  const length = row[5];
  const gerowongCm = row[13];
  const trimLen = row[15];
  const excelBruto = row[12];
  const excelNetto = row[17];
  if (!d1 || !d2 || !d3 || !d4 || !length) return;
  
  const avgDia = (d1 + d2 + d3 + d4) / 4;
  const roundedDia = Math.round(avgDia);
  const grossM3 = Math.round(roundedDia * roundedDia * length * 0.7854 / 10000 * 100) / 100;
  
  let gerowongM3 = 0;
  if (gerowongCm && gerowongCm > 0) {
    const effLen = length - (trimLen || 0);
    gerowongM3 = Math.round(gerowongCm * gerowongCm * effLen * 0.7854 / 10000 * 100) / 100;
  }
  let trimmingM3 = 0;
  if (trimLen && trimLen > 0) {
    trimmingM3 = Math.round(roundedDia * roundedDia * trimLen * 0.7854 / 10000 * 100) / 100;
  }
  const nettoM3 = Math.round((grossM3 - gerowongM3 - trimmingM3) * 100) / 100;
  
  totalDukbGross += grossM3;
  totalDukbNet += nettoM3;
  
  if (Math.abs(grossM3 - excelBruto) < 0.001 && Math.abs(nettoM3 - excelNetto) < 0.001) rawMatch++;
  else rawMismatch++;
});

console.log('\n=== RAW LOG (DUKB) RECONCILIATION ===');
console.log('Total DUKB rows:', dukbRows.length);
console.log('Formula EXACT match:', rawMatch);
console.log('Mismatch:', rawMismatch);
console.log('Total Gross M3:', totalDukbGross.toFixed(4));
console.log('Total Net M3:', totalDukbNet.toFixed(4));
console.log('VERDICT:', rawMismatch === 0 ? 'PASS' : 'MISMATCH');

// ===== TRIMMING LOG RECONCILIATION =====
const trimRaw = xlsx.utils.sheet_to_json(wb1.Sheets['Trimming log'], { defval: null, header: 1 });
const trimData = trimRaw.slice(4).filter(r => r[4] !== null && r[5] !== null);
let trimMatch = 0, trimMismatch = 0;

trimData.forEach(row => {
  const d1 = row[9], d2 = row[10], d3 = row[11], d4 = row[12];
  const length = parseFloat(row[8] || 0);
  const grCm = row[16];
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
  const nettoM3 = Math.round((grossM3 - gerowongM3) * 100) / 100;
  if (Math.abs(grossM3 - excelBrutto) < 0.001 && Math.abs(nettoM3 - excelNetto) < 0.001) trimMatch++;
  else trimMismatch++;
});

console.log('\n=== TRIMMING LOG RECONCILIATION ===');
console.log('Total trimming rows:', trimData.length);
console.log('Formula EXACT match:', trimMatch);
console.log('Mismatch:', trimMismatch);
console.log('VERDICT:', trimMismatch === 0 ? 'PASS' : 'MISMATCH');

// ===== STOCK SHEET =====
const stockRaw = xlsx.utils.sheet_to_json(wb1.Sheets['STOCK'], { defval: null, header: 1 });
const stockData = stockRaw.slice(3).filter(r => r[1] !== null && r[3] !== null);
let totalOpeningPcs = 0, totalMasukPcs = 0, totalKeluarPcs = 0;
let totalOpeningM3 = 0, totalMasukM3 = 0, totalKeluarM3 = 0;
let m3Match = 0, m3Mismatch = 0;

stockData.forEach(row => {
  const tbl = row[3], lbr = row[4], pjg = row[5];
  const awalPcs = parseFloat(row[6] || 0);
  const awalM3 = parseFloat(row[7] || 0);
  const masukPcs = parseFloat(row[8] || 0);
  const masukM3 = parseFloat(row[9] || 0);
  const keluarPcs = parseFloat(row[10] || 0);
  const keluarM3 = parseFloat(row[11] || 0);
  
  totalOpeningPcs += awalPcs;
  totalOpeningM3 += awalM3;
  totalMasukPcs += masukPcs;
  totalMasukM3 += masukM3;
  totalKeluarPcs += keluarPcs;
  totalKeluarM3 += keluarM3;
  
  if (awalPcs > 0 && tbl && lbr && pjg) {
    const calcM3 = (tbl * lbr * pjg * awalPcs) / 1000000000;
    if (Math.abs(calcM3 - awalM3) < 0.001) m3Match++;
    else m3Mismatch++;
  }
  if (masukPcs > 0 && tbl && lbr && pjg) {
    const calcM3 = (tbl * lbr * pjg * masukPcs) / 1000000000;
    if (Math.abs(calcM3 - masukM3) < 0.001) m3Match++;
    else m3Mismatch++;
  }
});

console.log('\n=== STOCK SHEET RECONCILIATION ===');
console.log('Stock SKUs:', stockData.length);
console.log('Stock Awal (Opening) PCS:', totalOpeningPcs, '| M3:', totalOpeningM3.toFixed(4));
console.log('Stock Masuk (IN) PCS:', totalMasukPcs, '| M3:', totalMasukM3.toFixed(4));
console.log('Stock Keluar (OUT) PCS:', totalKeluarPcs, '| M3:', totalKeluarM3.toFixed(4));
console.log('Sisa Expected PCS:', totalOpeningPcs + totalMasukPcs - totalKeluarPcs);
console.log('Sisa Expected M3:', (totalOpeningM3 + totalMasukM3 - totalKeluarM3).toFixed(4));
console.log('M3 formula check - match:', m3Match, 'mismatch:', m3Mismatch);
console.log('VERDICT:', m3Mismatch === 0 ? 'PASS' : 'HAS_ISSUES');

// ===== IMPLEMENTATION AUDIT =====
const fs = require('fs');
const path = require('path');
const baseDir = path.join(__dirname, 'src/inventory');
const files = fs.readdirSync(baseDir);
console.log('\n=== BACKEND IMPLEMENTATION AUDIT ===');
const EXPECTED = [
  { file: 'inventory-ledger.service.ts', label: 'InventoryLedgerService' },
  { file: 'raw-log.service.ts', label: 'RawLogService' },
  { file: 'trimmed-log.service.ts', label: 'TrimmedLogService' },
  { file: 'input-log.service.ts', label: 'InputLogService' },
  { file: 'sawn-timber.service.ts', label: 'SawnTimberService' },
  { file: 'stock-transfer.service.ts', label: 'StockTransferService' },
  { file: 'stock-adjustment.service.ts', label: 'StockAdjustmentService' },
  { file: 'timber-ledger.controller.ts', label: 'TimberLedgerController' },
  { file: 'import/import.service.ts', label: 'ImportService' },
  { file: 'timber-calculation.service.ts', label: 'TimberCalculationService' },
];
EXPECTED.forEach(e => {
  const exists = fs.existsSync(path.join(baseDir, e.file));
  console.log(`  ${exists ? '[IMPLEMENTED]' : '[MISSING]'} ${e.label}`);
});

// Check schema.prisma for key models
const schema = fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf8');
const REQUIRED_MODELS = ['RawLog', 'TrimmedLog', 'InputLog', 'SawnTimberOutput', 'TimberStock', 'TimberStockMovement', 'StockTransfer', 'StockAdjustment', 'ImportSession', 'TimberVariant'];
console.log('\n=== SCHEMA MODEL AUDIT ===');
REQUIRED_MODELS.forEach(m => {
  const found = schema.includes(`model ${m} {`);
  console.log(`  ${found ? '[IMPLEMENTED]' : '[MISSING]'} ${m}`);
});
