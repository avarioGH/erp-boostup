const fs = require('fs');
let c = fs.readFileSync('backend/src/hr/hr.controller.ts', 'utf8');

const newMethods = `
  @Permissions('hr.create')
  @Post('attendance/clock-in')
  async clockIn(@Request() req: any, @Body() data: any) {
    data.companyId = req.user.company_id;
    return this.hrService.clockIn(data);
  }

  @Permissions('hr.create')
  @Post('attendance/clock-out')
  async clockOut(@Request() req: any, @Body() data: any) {
    return this.hrService.clockOut(data);
  }

  @Permissions('hr.view')
  @Get('attendance/calendar/:employeeId')
  async getCalendar(
    @Request() req: any, 
    @Param('employeeId') employeeId: string,
    @Query('month') month: string,
    @Query('year') year: string
  ) {
    return this.hrService.getCalendar(employeeId, parseInt(month), parseInt(year));
  }

  @Permissions('hr.create')
  @Post('payroll/generate')
  async generatePayroll(@Request() req: any, @Body() data: any) {
    return this.hrService.generatePayroll(req.user.company_id, data.period);
  }
`;

if (!c.includes('clockIn(')) {
  c = c.replace(/export class HrController \{/, 'export class HrController {\n' + newMethods);
  fs.writeFileSync('backend/src/hr/hr.controller.ts', c);
  console.log('Added HR endpoints to controller');
} else {
  console.log('Endpoints already exist');
}
