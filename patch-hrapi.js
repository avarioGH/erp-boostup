const fs = require('fs');
const path = 'frontend/src/lib/api.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(
  /updateEmployee: async \(id: string, data: any\) => \(await api\.put\('\/hr\/employees\/' \+ id, data\)\)\.data,/,
  `updateEmployee: async (id: string, data: any) => (await api.put('/hr/employees/' + id, data)).data,\n  deleteEmployee: async (id: string) => (await api.delete('/hr/employees/' + id)).data,`
);
fs.writeFileSync(path, code);
console.log('Added deleteEmployee');
