const fs = require('fs');

let svc = fs.readFileSync('backend/src/hr/hr.service.ts', 'utf8');
svc = svc.replace(
  /async updateEmployee\(companyId: string, id: string, data: any\) \{/,
  `async deleteEmployee(companyId: string, id: string) {\n    return this.prisma.employee.delete({ where: { id, company_id: companyId } });\n  }\n\n  async updateEmployee(companyId: string, id: string, data: any) {`
);
fs.writeFileSync('backend/src/hr/hr.service.ts', svc);

let ctrl = fs.readFileSync('backend/src/hr/hr.controller.ts', 'utf8');
ctrl = ctrl.replace(
  /@Put\('employees\/:id'\)/,
  `@Permissions('hr.delete')\n  @Delete('employees/:id')\n  async deleteEmployee(@Request() req: any, @Param('id') id: string) {\n    return this.hrService.deleteEmployee(req.user.company_id, id);\n  }\n\n  @Put('employees/:id')`
);
// Also need to import Delete if not imported
ctrl = ctrl.replace(/Put,/g, 'Put, Delete,');
fs.writeFileSync('backend/src/hr/hr.controller.ts', ctrl);
console.log('Patched backend for delete employee');
