import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HrService } from './hr.service';

@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('departments')
  async getDepartments(@Request() req: any) {
    return this.hrService.getDepartments(req.user.company_id);
  }

  @Post('departments')
  async createDepartment(@Request() req: any, @Body() data: any) {
    data.companyId = req.user.company_id;
    return this.hrService.createDepartment(data);
  }

  @Get('employees')
  async getEmployees(@Request() req: any) {
    return this.hrService.getEmployees(req.user.company_id);
  }

  @Post('employees')
  async createEmployee(@Request() req: any, @Body() data: any) {
    data.companyId = req.user.company_id;
    return this.hrService.createEmployee(data);
  }

  @Put('employees/:id')
  async updateEmployee(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.hrService.updateEmployee(req.user.company_id, id, data);
  }

  @Post('employees/:id/biometric')
  async registerBiometric(@Request() req: any, @Body() data: any) {
    return this.hrService.registerBiometric(req.user.company_id, data.employeeId, data.rightThumb, data.leftThumb);
  }

  @Get('leaves')
  async getLeaves(@Request() req: any) {
    return this.hrService.getLeaves(req.user.company_id);
  }

  @Post('leaves')
  async createLeave(@Request() req: any, @Body() data: any) {
    data.companyId = req.user.company_id;
    return this.hrService.createLeave(data);
  }

  @Post('leaves/:id/approve')
  async approveLeave(@Request() req: any, @Param('id') id: string) {
    return this.hrService.approveLeave(req.user.company_id, id);
  }

  @Post('leaves/:id/reject')
  async rejectLeave(@Request() req: any, @Param('id') id: string) {
    return this.hrService.rejectLeave(req.user.company_id, id);
  }

  @Get('attendance')
  async getAttendances(@Request() req: any) {
    return this.hrService.getAttendances(req.user.company_id);
  }

  @Post('attendance')
  async createAttendance(@Request() req: any, @Body() data: any) {
    return this.hrService.createAttendance(data);
  }

  @Post('attendance/clock')
  async clockAttendance(@Request() req: any, @Body() data: { employee_code: string, timestamp?: string }) {
    return this.hrService.clockAttendance(req.user.company_id, data);
  }

  @Get('payroll')
  async getPayrolls(@Request() req: any) {
    return this.hrService.getPayrolls(req.user.company_id);
  }

  @Post('payroll/:employeeId/calculate')
  async calculatePayroll(@Request() req: any, @Param('employeeId') employeeId: string, @Body() data: { period: string }) {
    return this.hrService.calculatePayroll(req.user.company_id, employeeId, data.period);
  }

  @Post('payroll/:id/approve')
  async approvePayroll(@Request() req: any, @Param('id') id: string) {
    return this.hrService.approvePayroll(req.user.company_id, id);
  }

  @Post('payroll/:id/post')
  async postPayroll(@Request() req: any, @Param('id') id: string) {
    return this.hrService.postPayroll(req.user.company_id, id);
  }

  @Post('payroll/:id/pay')
  async payPayroll(@Request() req: any, @Param('id') id: string) {
    return this.hrService.payPayroll(req.user.company_id, id);
  }
}
