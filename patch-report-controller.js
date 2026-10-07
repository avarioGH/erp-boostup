const fs = require('fs');
const path = 'backend/src/hr/hr.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const reportRoute = `
  @Permissions('hr.view')
  @Get('performance-report')
  async getPerformanceReport(
    @Request() req: any,
    @Query('month') month: string,
    @Query('year') year: string
  ) {
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();
    return this.hrService.getPerformanceReport(req.user.company_id, m, y);
  }
`;

code = code.replace(
  /export class HrController \{/,
  'export class HrController {\n' + reportRoute
);

fs.writeFileSync(path, code);
console.log('patched hr.controller.ts with report');
