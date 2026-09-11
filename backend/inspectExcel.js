const xlsx = require('xlsx');
const path = require('path');

const wb = xlsx.readFile('C:\\Users\\Billion\\Downloads\\1. Oktober 2025.xlsx');
console.log('Sheets:', wb.SheetNames);

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(ws, { defval: null });
  console.log(`\nSheet: "${sheetName}" — Rows: ${data.length}`);
  if (data.length > 0) {
    console.log('Columns:', Object.keys(data[0]).join(', '));
    console.log('Sample row 1:', JSON.stringify(data[0]));
    if (data.length > 1) console.log('Sample row 2:', JSON.stringify(data[1]));
  }
}
