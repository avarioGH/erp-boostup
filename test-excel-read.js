const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const files = [
  "excel1.xlsx",
  "excel2.xlsx",
  "excel3.xlsx",
  "excel4.xlsx"
];

const basePath = 'c:/Users/Billion/downloads/workspace/keuangan/';
const data = {};

for (const f of files) {
  const p = path.join(basePath, f);
  if (fs.existsSync(p)) {
    try {
      const wb = xlsx.readFile(p);
      data[f] = wb.SheetNames.map(sn => {
        const sheet = wb.Sheets[sn];
        if (!sheet['!ref']) return { sheetName: sn, headers: [] };
        const range = xlsx.utils.decode_range(sheet['!ref']);
        const headers = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
          let val = null;
          for (let r = 0; r < 5; r++) { // search first 5 rows for headers
            const cell = sheet[xlsx.utils.encode_cell({r, c})];
            if (cell && cell.v) {
              val = cell.v;
              break;
            }
          }
          if (val) headers.push(val);
        }
        return { sheetName: sn, headers: [...new Set(headers)] };
      });
    } catch (e) {
      data[f] = "ERROR PARSING: " + e.message;
    }
  } else {
    data[f] = "FILE NOT FOUND";
  }
}

console.log(JSON.stringify(data, null, 2));
