const xlsx = require('xlsx');
const fs = require('fs');

function inspectHeaders(file, sheetName) {
    const wb = xlsx.readFile(file);
    const sheet = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, {header: 1, range: 0});
    console.log(`\n=== ${file} : ${sheetName} ===`);
    for(let i=0; i<5; i++) {
        if(data[i]) console.log(`Row ${i}: `, data[i].slice(0, 15).join(' | '));
    }
}

inspectHeaders('excel1.xlsx', 'Input log');
inspectHeaders('excel2.xlsx', 'DUKB');
inspectHeaders('excel3.xlsx', 'DATA MUAT');
inspectHeaders('excel4.xlsx', 'MERANTI');
