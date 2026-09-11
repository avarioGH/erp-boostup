const xlsx = require('xlsx');

const wb2 = xlsx.readFile('C:/Users/Billion/Downloads/1. Oktober 2025.xlsx');
const wb1 = xlsx.readFile('C:/Users/Billion/Downloads/13. PROD SWM ULIN AWIE.xlsx');

// Fix: Output sheet has merged header in row 1 as "OUTPUT", actual headers in row 1 as data
const outRaw = xlsx.utils.sheet_to_json(wb2.Sheets['Output Sawn timber'], { defval: null, header: 1 });
console.log('=== OUTPUT SAWN TIMBER RAW ROWS ===');
for (let i = 0; i < 4; i++) {
  console.log('Row', i, ':', JSON.stringify(outRaw[i] && outRaw[i].slice(0, 12)));
}

// Real headers are at row index 1 (0-based)
const outHeaders = outRaw[1];
console.log('Actual headers (row 1):', JSON.stringify(outHeaders));

// Data from row 2 onwards
const outData = outRaw.slice(2).filter(r => r[0] !== null && r[3] !== null);
console.log('Data rows (with BUNDEL):', outData.length);

// Map columns: 0=TANGGAL, 1=SHIFT, 2=GUDANG, 3=BUNDEL, 4=NO.INPUT, 5=PRODUK, 6=UKURAN, 7=QTY, 8=M3, 9=Partai, 10=Ket
let outMatch = 0, outRounding = 0, outMismatch = 0, outParseErr = 0;
let totalExcelM3 = 0, totalErpM3 = 0;
const outMismatches = [];
const bundleSample = [];

outData.forEach((row, idx) => {
  const bundel = row[3];
  const noInput = row[4];
  const produk = row[5];
  const sizeStr = String(row[6] || '').trim();
  const qty = parseFloat(row[7] || 0);
  const excelM3 = parseFloat(row[8] || 0);
  
  if (idx < 3) bundleSample.push({ bundel, noInput, produk, sizeStr, qty, excelM3 });
  
  if (!sizeStr || !qty) return;
  
  // Parse sizes: 42 x 210 x 2450 or 42×210×2450 etc
  const m = sizeStr.match(/(\d+)\s*[xX\xd7\*]\s*(\d+)\s*[xX\xd7\*]\s*(\d+)/);
  if (!m) { outParseErr++; return; }
  
  const t = parseInt(m[1]), w = parseInt(m[2]), l = parseInt(m[3]);
  const erpM3 = (t * w * l * qty) / 1000000000;
  const diff = Math.abs(erpM3 - excelM3);
  
  totalExcelM3 += excelM3;
  totalErpM3 += erpM3;
  
  if (diff < 0.0001) outMatch++;
  else if (diff < 0.005) outRounding++;
  else {
    outMismatch++;
    if (outMismatches.length < 5) outMismatches.push({ bundel, size: sizeStr, qty, excelM3, erpM3, diff: diff.toFixed(8) });
  }
});

console.log('\nSample data rows:', JSON.stringify(bundleSample, null, 2));
console.log('\n=== SAWN TIMBER OUTPUT M3 RECONCILIATION ===');
console.log('Total data rows:', outData.length);
console.log('Parse errors:', outParseErr);
console.log('EXACT match:', outMatch);
console.log('Rounding diff (<0.005):', outRounding);
console.log('Mismatch:', outMismatch);
console.log('Total Excel M3:', totalExcelM3.toFixed(6));
console.log('Total ERP M3:', totalErpM3.toFixed(6));
console.log('Difference:', (totalErpM3 - totalExcelM3).toFixed(6));
if (outMismatches.length) console.log('Mismatches:', JSON.stringify(outMismatches, null, 2));

// ===== STOCK SHEET ANALYSIS =====
const stockRaw = xlsx.utils.sheet_to_json(wb1.Sheets['STOCK'], { defval: null, header: 1 });
// Headers: row 2 = UKURAN, GRADE, Tbl, Lbr, Pjg, Pcs (awal), M3 (awal), Pcs (masuk), M3 (masuk), Pcs (keluar), M3 (keluar)
const stockData = stockRaw.slice(3).filter(r => r[1] !== null && r[3] !== null);
console.log('\n=== STOCK OPENING BALANCE ===');
console.log('Total stock SKUs:', stockData.length);
let totalOpeningPcs = 0, totalOpeningM3 = 0;
let totalMasukPcs = 0, totalMasukM3 = 0;
let totalKeluarPcs = 0, totalKeluarM3 = 0;

stockData.forEach(row => {
  const tbl = parseFloat(row[3] || 0); 
  const lbr = parseFloat(row[4] || 0); 
  const pjg = parseFloat(row[5] || 0);
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
});

console.log('Stock Awal total PCS:', totalOpeningPcs);
console.log('Stock Awal total M3:', totalOpeningM3.toFixed(4));
console.log('Stock Masuk total PCS:', totalMasukPcs);
console.log('Stock Masuk total M3:', totalMasukM3.toFixed(4));
console.log('Stock Keluar total PCS:', totalKeluarPcs);
console.log('Stock Keluar total M3:', totalKeluarM3.toFixed(4));
console.log('Sisa PCS (expected):', totalOpeningPcs + totalMasukPcs - totalKeluarPcs);
console.log('Sisa M3 (expected):', (totalOpeningM3 + totalMasukM3 - totalKeluarM3).toFixed(4));

// Also verify M3 formula for opening balance:
let m3CalcMatch = 0, m3CalcMismatch = 0;
stockData.forEach(row => {
  const tbl = parseFloat(row[3] || 0); 
  const lbr = parseFloat(row[4] || 0); 
  const pjg = parseFloat(row[5] || 0);
  const awalPcs = parseFloat(row[6] || 0);
  const excelAwalM3 = parseFloat(row[7] || 0);
  if (!awalPcs || !tbl || !lbr || !pjg) return;
  const calcM3 = (tbl * lbr * pjg * awalPcs) / 1000000000;
  if (Math.abs(calcM3 - excelAwalM3) < 0.001) m3CalcMatch++;
  else m3CalcMismatch++;
});
console.log('\nOpening M3 formula check - match:', m3CalcMatch, 'mismatch:', m3CalcMismatch);

// Input Log Oktober 2025
const inputOkt = xlsx.utils.sheet_to_json(wb2.Sheets['Input log'], { defval: null, header: 1 });
console.log('\n=== INPUT LOG (Oktober 2025) ===');
for (let i = 0; i < 4; i++) console.log('Row', i, ':', JSON.stringify(inputOkt[i] && inputOkt[i].slice(0, 12)));
const inputData = inputOkt.slice(2).filter(r => r[3] !== null);
console.log('Data rows:', inputData.length);
