const xlsx = require('xlsx');
const wb = xlsx.readFile('C:\\Users\\Billion\\Downloads\\1. Oktober 2025.xlsx');
const ws = wb.Sheets['Output Sawn timber'];
const data = xlsx.utils.sheet_to_json(ws, { defval: null });

// First row is the header row
const headers = data[0];
console.log('Header row:', JSON.stringify(headers));

// Data rows start from index 1
const rows = data.slice(1);
console.log('Data rows:', rows.length);

// Count unique bundles
const bundles = new Set(rows.map(r => r['__EMPTY_2']).filter(Boolean));
console.log('Unique bundles:', bundles.size);

// Show bundle samples
const bundleArr = [...bundles];
console.log('First 5 bundles:', bundleArr.slice(0, 5));
console.log('Last 5 bundles:', bundleArr.slice(-5));

// Summary stats
const totalQty = rows.reduce((s, r) => s + (Number(r['__EMPTY_7']) || 0), 0);
const totalM3 = rows.reduce((s, r) => s + (Number(r['__EMPTY_8']) || 0), 0);
console.log('Total QTY:', totalQty);
console.log('Total M3:', totalM3.toFixed(4));

// Check null/empty bundels
const nullBundles = rows.filter(r => !r['__EMPTY_2']);
console.log('Rows with null bundle:', nullBundles.length);

// Sample 3 rows
console.log('\nSample rows:');
rows.slice(0, 3).forEach((r, i) => console.log(`Row ${i+1}:`, JSON.stringify(r)));
