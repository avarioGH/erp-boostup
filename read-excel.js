const xlsx = require('xlsx');
const fs = require('fs');

const files = ['excel1.xlsx', 'excel2.xlsx', 'excel3.xlsx', 'excel4.xlsx'];

files.forEach(file => {
    console.log(`\n\n=== Reading ${file} ===`);
    try {
        const workbook = xlsx.readFile(file);
        const sheetNames = workbook.SheetNames;
        console.log(`Sheets: ${sheetNames.join(', ')}`);
        
        sheetNames.slice(0, 2).forEach(sheetName => {
            console.log(`\n-- Sheet: ${sheetName} --`);
            const sheet = workbook.Sheets[sheetName];
            const json = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });
            
            // Print first 10 rows
            for (let i = 0; i < Math.min(15, json.length); i++) {
                console.log(`Row ${i + 1}:`, json[i].filter(c => c !== null).join(' | '));
            }
        });
    } catch (e) {
        console.log(`Error reading ${file}:`, e.message);
    }
});
