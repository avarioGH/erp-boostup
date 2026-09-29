const fs = require('fs');

// Patch 1: List Page
const listPath = 'frontend/src/app/sales/exports/page.tsx';
let listContent = fs.readFileSync(listPath, 'utf8');
listContent = listContent.replace('setData(res)', 'setData(res?.data || res || [])');
listContent = listContent.replace('data.length === 0', '(!data || data.length === 0)');
listContent = listContent.replace('data.map', '(data || []).map');
fs.writeFileSync(listPath, listContent, 'utf8');

// Patch 2: Print Page
const printPath = 'frontend/src/app/sales/exports/[id]/print/page.tsx';
let printContent = fs.readFileSync(printPath, 'utf8');
printContent = printContent.replace('setData(res)', 'setData(res?.data || res || null)');
// also ensure data.items is safe
printContent = printContent.replace('data.items.reduce', '(data.items || []).reduce');
fs.writeFileSync(printPath, printContent, 'utf8');
