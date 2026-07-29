import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HrService } from './hr.service';

@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('departments')
  async getDepartments(@Request() req) {
    return this.hrService.getDepartments(req.user.company_id);
  }

  @Post('departments')
  async createDepartment(@Request() req, @Body() data: any) {
    data.companyId = req.user.company_id;
    return this.hrService.createDepartment(data);
  }

  @Get('employees')
  async getEmployees(@Request() req) {
    return this.hrService.getEmployees(req.user.company_id);
  }

  @Post('employees')
  async createEmployee(@Request() req, @Body() data: any) {
    data.companyId = req.user.company_id;
    return this.hrService.createEmployee(data);
  }

  @Post('employees/:id/biometric')
  async registerBiometric(@Request() req, @Body() data: any) {
    // data should contain { employeeId, rightThumb, leftThumb }
    return this.hrService.registerBiometric(req.user.company_id, data.employeeId, data.rightThumb, data.leftThumb);
  }

  @Get('attendance')
  async getAttendances(@Request() req) {
    return this.hrService.getAttendances(req.user.company_id);
  }

  @Post('attendance')
  async createAttendance(@Request() req, @Body() data: any) {
    return this.hrService.createAttendance(data);
  }

  @Post('attendance/clock')
  async clockAttendance(@Request() req, @Body() data: { employee_code: string, timestamp?: string }) {
    return this.hrService.clockAttendance(req.user.company_id, data);
  }

  @Get('payroll')
  async getPayrolls(@Request() req) {
    return this.hrService.getPayrolls(req.user.company_id);
  }

  @Post('payroll')
  async createPayroll(@Request() req, @Body() data: any) {
    return this.hrService.createPayroll(data);
  }
}
