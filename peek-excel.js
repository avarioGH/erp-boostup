const xlsx = require('xlsx');

const files = ['excel1.xlsx', 'excel2.xlsx', 'excel3.xlsx', 'excel4.xlsx'];
files.forEach(file => {
    try {
        const wb = xlsx.readFile(file);
        console.log(`\n--- ${file} ---`);
        console.log(wb.SheetNames);
    } catch(e) {
        console.error(`Error reading ${file}:`, e.message);
    }
});
