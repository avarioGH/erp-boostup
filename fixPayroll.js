const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/hr/payroll/page.tsx', 'utf8');

// The error was on api.post("/hr/payroll", { employeeId, ... })
// But wait, HrAPI doesn't have createPayroll. 
// Let's add it to HrAPI first.
let apiContent = fs.readFileSync('frontend/src/lib/api.ts', 'utf8');
apiContent = apiContent.replace(
  /getPayrolls: async \(\) => \(await api\.get\('\/hr\/payroll'\)\)\.data,/,
  "getPayrolls: async () => (await api.get('/hr/payroll')).data,\n  createPayroll: async (data: any) => (await api.post('/hr/payroll', data)).data,"
);
fs.writeFileSync('frontend/src/lib/api.ts', apiContent);

content = content.replace(
  /api\.post\("\/hr\/payroll"/g,
  'HrAPI.createPayroll'
);

fs.writeFileSync('frontend/src/app/hr/payroll/page.tsx', content);
console.log('Fixed payroll page');
