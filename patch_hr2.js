const fs = require('fs');
let code = fs.readFileSync('backend/src/hr/hr.service.ts', 'utf8');

// Fix the bad regex replacement
code = code.replace(/company_id:\s*companyId,\s*employee_id:\s*data\.employeeId,/g, "company_id: data.companyId, employee_id: data.employeeId,");
code = code.replace(/company_id:\s*data\.companyId,\s*company_id:\s*data\.companyId,\s*/g, "company_id: data.companyId, ");

fs.writeFileSync('backend/src/hr/hr.service.ts', code, 'utf8');
