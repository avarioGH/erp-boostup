import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
﻿import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HrService } from './hr.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Permissions('hr.view')
  @Get('departments')
  async getDepartments(@Request() req: any) {
    return this.hrService.getDepartments(req.user.company_id);
  }

  @Permissions('hr.create')
  @Post('departments')
  async createDepartment(@Request() req: any, @Body() data: any) {
    data.companyId = req.user.company_id;
    return this.hrService.createDepartment(data);
  }

  @Permissions('hr.view')
  @Get('employees')
  async getEmployees(@Request() req: any) {
    return this.hrService.getEmployees(req.user.company_id);
  }

  @Permissions('hr.create')
  @Post('employees')
  async createEmployee(@Request() req: any, @Body() data: any) {
    data.companyId = req.user.company_id;
    return this.hrService.createEmployee(data);
  }

  @Permissions('hr.update')
  @Put('employees/:id')
  async updateEmployee(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.hrService.updateEmployee(req.user.company_id, id, data);
  }

  @Permissions('hr.create')
  @Post('employees/:id/biometric')
  async registerBiometric(@Request() req: any, @Body() data: any) {
    return this.hrService.registerBiometric(req.user.company_id, data.employeeId, data.rightThumb, data.leftThumb);
  }

  @Permissions('hr.view')
  @Get('leaves')
  async getLeaves(@Request() req: any) {
    return this.hrService.getLeaves(req.user.company_id);
  }

  @Permissions('hr.create')
  @Post('leaves')
  async createLeave(@Request() req: any, @Body() data: any) {
    data.companyId = req.user.company_id;
    return this.hrService.createLeave(data);
  }

  @Permissions('hr.create')
  @Post('leaves/:id/approve')
  async approveLeave(@Request() req: any, @Param('id') id: string) {
    return this.hrService.approveLeave(req.user.company_id, id);
  }

  @Permissions('hr.create')
  @Post('leaves/:id/reject')
  async rejectLeave(@Request() req: any, @Param('id') id: string) {
    return this.hrService.rejectLeave(req.user.company_id, id);
  }

  @Permissions('hr.view')
  @Get('attendance')
  async getAttendances(@Request() req: any) {
    return this.hrService.getAttendances(req.user.company_id);
  }

  @Permissions('hr.create')
  @Post('attendance')
  async createAttendance(@Request() req: any, @Body() data: any) {
    return this.hrService.createAttendance(data);
  }

  @Permissions('hr.create')
  @Post('attendance/clock')
  async clockAttendance(@Request() req: any, @Body() data: { employee_code: string, timestamp?: string }) {
    return this.hrService.clockAttendance(req.user.company_id, data);
  }

  @Permissions('hr.view')
  @Get('payroll')
  async getPayrolls(@Request() req: any) {
    return this.hrService.getPayrolls(req.user.company_id);
  }

  @Permissions('hr.create')
  @Post('payroll/:employeeId/calculate')
  async calculatePayroll(@Request() req: any, @Param('employeeId') employeeId: string, @Body() data: { period: string }) {
    return this.hrService.calculatePayroll(req.user.company_id, employeeId, data.period);
  }

  @Permissions('hr.create')
  @Post('payroll/:id/approve')
  async approvePayroll(@Request() req: any, @Param('id') id: string) {
    return this.hrService.approvePayroll(req.user.company_id, id);
  }

  @Permissions('hr.create')
  @Post('payroll/:id/post')
  async postPayroll(@Request() req: any, @Param('id') id: string) {
    return this.hrService.postPayroll(req.user.company_id, id);
  }

  @Permissions('hr.create')
  @Post('payroll/:id/pay')
  async payPayroll(@Request() req: any, @Param('id') id: string) {
    return this.hrService.payPayroll(req.user.company_id, id);
  }
}
