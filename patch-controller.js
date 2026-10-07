const fs = require('fs');
const path = 'backend/src/hr/hr.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const shiftRoutes = `
  // --- SHIFT MANAGEMENT ---
  @Permissions('hr.view')
  @Get('shifts')
  async getShifts(@Request() req: any) {
    return this.hrService.getShifts(req.user.company_id);
  }

  @Permissions('hr.create')
  @Post('shifts')
  async createShift(@Request() req: any, @Body() data: any) {
    data.company_id = req.user.company_id;
    return this.hrService.createShift(data);
  }

  @Permissions('hr.update')
  @Put('shifts/:id')
  async updateShift(@Param('id') id: string, @Body() data: any) {
    return this.hrService.updateShift(id, data);
  }

  @Permissions('hr.delete')
  @Post('shifts/:id/delete')
  async deleteShift(@Param('id') id: string) {
    return this.hrService.deleteShift(id);
  }

  @Permissions('hr.update')
  @Post('employees/:id/shift')
  async setEmployeeShift(@Param('id') id: string, @Body() data: { shift_id: string }) {
    return this.hrService.setEmployeeShift(id, data.shift_id);
  }
`;

code = code.replace(
  /export class HrController \{/,
  'export class HrController {\n' + shiftRoutes
);

fs.writeFileSync(path, code);
console.log('patched hr.controller.ts');
