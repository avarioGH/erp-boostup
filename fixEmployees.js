const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/hr/employees/page.tsx', 'utf8');

content = content.replace('import { api } from "@/lib/api"', 'import { HrAPI } from "@/lib/api"');
content = content.replace('api.get("/hr/employees")', 'HrAPI.getEmployees()');
content = content.replace('api.get("/hr/departments")', 'HrAPI.getDepartments()');

// Replace createEmployee
content = content.replace(
  /const res = await api\.post\("\/hr\/employees", \{[^}]+\}\)/g,
  'const res = await HrAPI.createEmployee({\n          firstName: formData.firstName,\n          lastName: formData.lastName,\n          email: formData.email,\n          position: formData.position,\n          basicSalary: Number(formData.basicSalary)\n        })'
);

// Replace biometric
content = content.replace(
  /await api\.post\(`\/hr\/employees\/\$\{selectedEmp\.id\}\/biometric`, \{[^}]+\}\)/g,
  'await HrAPI.registerBiometric(selectedEmp.id, {\n          employeeId: selectedEmp.id,\n          rightThumb: "base64_simulated_right_thumb_template",\n          leftThumb: "base64_simulated_left_thumb_template"\n        })'
);

fs.writeFileSync('frontend/src/app/hr/employees/page.tsx', content);
console.log('Fixed HR employees page properly');
