const xlsx = require('xlsx');

const wb1 = xlsx.readFile('C:/Users/Billion/Downloads/13. PROD SWM ULIN AWIE.xlsx');
const wb2 = xlsx.readFile('C:/Users/Billion/Downloads/1. Oktober 2025.xlsx');

// ===== DUKB RAW LOG RECONCILIATION =====
const dukbRaw = xlsx.utils.sheet_to_json(wb1.Sheets['DUKB'], { defval: null, header: 1 });
// Col: 0=Nomor Urut, 1=Log, 2=Kode, 3=Jenis, 4=Qty, 5=Pjng
//      6=D1, 7=D2, 8=D3, 9=D4, 10=Avg, 11=Rounded
//      12=Bruto M3, 13=Gerowong Cm, 14=Gerowong M3, 15=Trimming Pjng, 16=Trimming M3
//      17=Netto M3, 18=ID BARCODE, 19=KLS DMTR
const dukbRows = dukbRaw.slice(5).filter(r => r[0] !== null && typeof r[0] === 'number');
console.log('=== RAW LOG (DUKB) ===');
console.log('Total rows in Excel:', dukbRows.length);

let rawMatch = 0, rawRounding = 0, rawMismatch = 0;
const rawMismatches = [];

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
  const brutoDiff = Math.abs(grossM3 - (excelBruto || 0));
  const nettoDiff = Math.abs(nettoM3 - (excelNetto || 0));
  
  if (brutoDiff < 0.001 && nettoDiff < 0.001) rawMatch++;
  else if (brutoDiff < 0.01 || nettoDiff < 0.01) rawRounding++;
  else {
    rawMismatch++;
    if (rawMismatches.length < 5) rawMismatches.push({
      log: row[1], nomor: row[0], d1,d2,d3,d4, length,
      avgDia, roundedDia,
      grossExcel: excelBruto, grossERP: grossM3,
      nettoExcel: excelNetto, nettoERP: nettoM3
    });
  }
});

console.log('Formula EXACT match:', rawMatch);
console.log('Rounding diff:', rawRounding);
console.log('Mismatches:', rawMismatch);
if (rawMismatches.length > 0) {
  console.log('Sample mismatches:');
  rawMismatches.forEach(m => console.log(JSON.stringify(m)));
}

// ===== TRIMMING LOG =====
const trimRaw = xlsx.utils.sheet_to_json(wb1.Sheets['Trimming log'], { defval: null, header: 1 });
console.log('\n=== TRIMMING LOG ===');
console.log('Total rows in Excel:', trimRaw.slice(2).filter(r => r[0] !== null && r[0] !== 'NO LOG').length);
// Look at first 3 data rows
for (let i = 0; i < 6; i++) {
  console.log('Trim row', i, ':', JSON.stringify(trimRaw[i] && trimRaw[i].slice(0, 20)));
}

// ===== INPUT LOG =====
const inputRaw = xlsx.utils.sheet_to_json(wb1.Sheets['Input Log'], { defval: null, header: 1 });
console.log('\n=== INPUT LOG (PROD SWM) ===');
console.log('Total rows:', inputRaw.slice(2).filter(r => r[0] !== null).length);
console.log('Header row 0:', JSON.stringify(inputRaw[0] && inputRaw[0].slice(0, 15)));
console.log('Header row 1:', JSON.stringify(inputRaw[1] && inputRaw[1].slice(0, 15)));
console.log('Data row 2:', JSON.stringify(inputRaw[2] && inputRaw[2].slice(0, 15)));

// ===== SAWN TIMBER OUTPUT =====
const outSheet = xlsx.utils.sheet_to_json(wb2.Sheets['Output Sawn timber'], { defval: null });
console.log('\n=== SAWN TIMBER OUTPUT (Oktober 2025) ===');
console.log('Total rows:', outSheet.length);
console.log('Headers:', Object.keys(outSheet[0] || {}));
console.log('First row:', JSON.stringify(outSheet[0]));

let outMatch = 0, outRounding = 0, outMismatch = 0, outSkip = 0;
let totalExcelM3 = 0, totalErpM3 = 0;
const outMismatches = [];

outSheet.forEach(row => {
  const sizeStr = String(row['UKURAN'] || row['Ukuran'] || '').trim();
  const qty = parseFloat(row['QTY'] || row['Qty'] || 0);
  const excelM3 = parseFloat(row['M3'] || 0);
  if (!sizeStr || !qty || sizeStr === 'UKURAN') { outSkip++; return; }
  
  const m = sizeStr.match(/(\d+)\s*[xX\xd7\*]\s*(\d+)\s*[xX\xd7\*]\s*(\d+)/);
  if (!m) { outSkip++; return; }
  
  const t = parseInt(m[1]), w = parseInt(m[2]), l = parseInt(m[3]);
  const erpM3 = (t * w * l * qty) / 1000000000;
  const diff = Math.abs(erpM3 - excelM3);
  
  totalExcelM3 += excelM3;
  totalErpM3 += erpM3;
  
  if (diff < 0.0001) outMatch++;
  else if (diff < 0.005) outRounding++;
  else {
    outMismatch++;
    if (outMismatches.length < 3) outMismatches.push({ bundel: row['BUNDEL'], size: sizeStr, qty, excelM3, erpM3, diff });
  }
});

console.log('Match:', outMatch, '| Rounding:', outRounding, '| Mismatch:', outMismatch, '| Skip:', outSkip);
console.log('Total Excel M3:', totalExcelM3.toFixed(6));
console.log('Total ERP M3:', totalErpM3.toFixed(6));
console.log('Difference:', (totalErpM3 - totalExcelM3).toFixed(6));
if (outMismatches.length > 0) console.log('Sample output mismatches:', JSON.stringify(outMismatches, null, 2));

// ===== STOCK SHEET =====
const stockRaw = xlsx.utils.sheet_to_json(wb1.Sheets['STOCK'], { defval: null, header: 1 });
console.log('\n=== STOCK SHEET (PROD SWM) ===');
console.log('Total rows:', stockRaw.length);
for (let i = 0; i < 5; i++) {
  console.log('Stock row', i, ':', JSON.stringify(stockRaw[i] && stockRaw[i].slice(0, 12)));
}
