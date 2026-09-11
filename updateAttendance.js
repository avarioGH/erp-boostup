const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/hr/attendance/page.tsx', 'utf8');
content = content.replace('import { api } from "@/lib/api"', 'import { HrAPI } from "@/lib/api"');
content = content.replace('api.get("/hr/employees")', 'HrAPI.getEmployees()');
content = content.replace('api.get("/hr/attendance")', 'HrAPI.getAttendances()');
content = content.replace(/api\.post\("\/hr\/attendance\/clock", \{[\s\S]*?\}\)/, 'HrAPI.clockAttendance({ employee_code: employeeCode })');
fs.writeFileSync('frontend/src/app/hr/attendance/page.tsx', content);
console.log('Fixed HR attendance page');
