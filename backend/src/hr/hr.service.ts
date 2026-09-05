import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  // Departments
  async getDepartments(companyId: string) {
    return this.prisma.department.findMany({
      where: { company_id: companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async createDepartment(data: any) {
    return this.prisma.department.create({
      data: {
        company_id: data.companyId,
        name: data.name,
        description: data.description,
      },
    });
  }

  // Employees
  async getEmployees(companyId: string) {
    return this.prisma.employee.findMany({
      where: { company_id: companyId },
      include: { department: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async createEmployee(data: any) {
    return this.prisma.employee.create({
      data: {
        company_id: data.companyId,
        department_id: data.departmentId,
        employee_code: data.employeeCode || ('EMP-' + Date.now()),
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        position: data.position,
        status: data.status || 'ACTIVE',
        basic_salary: data.basicSalary ? Number(data.basicSalary) : 0,
        join_date: new Date(),
      },
    });
  }

  async updateEmployee(companyId: string, id: string, data: any) {
    return this.prisma.employee.update({
      where: { id, company_id: companyId },
      data: {
        department_id: data.departmentId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        position: data.position,
        status: data.status,
        basic_salary: data.basicSalary ? Number(data.basicSalary) : undefined,
      }
    });
  }

  
  async registerBiometric(companyId: string, employeeId: string, rightThumb: string, leftThumb: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, company_id: companyId }
    });
    if (!employee) throw new NotFoundException("Employee not found");
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        fingerprint_right_thumb: rightThumb,
        fingerprint_left_thumb: leftThumb
      }
    });
  }

  // Leaves
  async getLeaves(companyId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { company_id: companyId },
      include: { employee: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async createLeave(data: any) {
    return this.prisma.leaveRequest.create({
      data: {
        company_id: data.companyId,
        employee_id: data.employeeId,
        leave_type: data.leaveType,
        start_date: new Date(data.startDate),
        end_date: new Date(data.endDate),
        reason: data.reason,
        status: 'SUBMITTED',
      }
    });
  }

  async approveLeave(companyId: string, id: string) {
    return this.prisma.leaveRequest.update({
      where: { id, company_id: companyId },
      data: { status: 'APPROVED' }
    });
  }

  async rejectLeave(companyId: string, id: string) {
    return this.prisma.leaveRequest.update({
      where: { id, company_id: companyId },
      data: { status: 'REJECTED' }
    });
  }

  // Attendance
  async getAttendances(companyId: string) {
    return this.prisma.attendance.findMany({
      where: { employee: { company_id: companyId } },
      include: { employee: true },
      orderBy: { date: 'desc' },
    });
  }

  async createAttendance(data: any) {
    return this.prisma.attendance.create({
      data: {
        employee_id: data.employeeId,
        date: new Date(data.date),
        status: data.status,
        check_in: data.checkIn ? new Date(data.checkIn) : null,
        check_out: data.checkOut ? new Date(data.checkOut) : null,
        notes: data.notes,
      },
    });
  }

  async clockAttendance(companyId: string, data: { employee_code: string, timestamp?: string }) {
    const employee = await this.prisma.employee.findFirst({
      where: { company_id: companyId, employee_code: data.employee_code }
    });

    if (!employee) throw new NotFoundException("Employee not found");

    const clockTime = data.timestamp ? new Date(data.timestamp) : new Date();
    const todayStr = clockTime.toISOString().split('T')[0];
    const startDate = new Date(todayStr + "T00:00:00.000Z");
    const endDate = new Date(todayStr + "T23:59:59.999Z");

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: { employee_id: employee.id, date: { gte: startDate, lte: endDate } }
    });

    if (existingAttendance) {
      if (existingAttendance.check_out) throw new BadRequestException('Already checked out for today');
      if (clockTime <= (existingAttendance.check_in || clockTime)) {
         throw new BadRequestException('Check-out must be after check-in');
      }
      return this.prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: { check_out: clockTime, status: 'PRESENT' }
      });
    } else {
      return this.prisma.attendance.create({
        data: {
          employee_id: employee.id,
          date: clockTime,
          status: 'PRESENT',
          check_in: clockTime,
        }
      });
    }
  }

  // Payroll
  async getPayrolls(companyId: string) {
    return this.prisma.payroll.findMany({
      where: { company_id: companyId },
      include: { employee: true, items: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async calculatePayroll(companyId: string, employeeId: string, period: string) {
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findUnique({
        where: { id: employeeId, company_id: companyId }
      });
      if (!employee) throw new NotFoundException('Employee not found');
      if (employee.status === 'TERMINATED') throw new BadRequestException('Cannot calculate payroll for terminated employee');

      // Check if Draft payroll already exists
      let payroll = await tx.payroll.findFirst({
        where: { company_id: companyId, employee_id: employeeId, period: period }
      });

      if (payroll && payroll.status !== 'DRAFT') {
         throw new BadRequestException('Payroll already calculated/approved for this period');
      }

      // Cleanup existing draft items
      if (payroll) {
         await tx.payrollItem.deleteMany({ where: { payroll_id: payroll.id } });
      }

      // Base Calculation logic
      const basicSalary = employee.basic_salary || 0;
      let totalDeduction = 0;
      const items: any[] = [];

      // 1. Calculate absences
      // For simplicity, we just count absent days in the DB for that period.
      // E.g. period = "2026-09"
      const absents = await tx.attendance.count({
         where: { 
           employee_id: employeeId, 
           status: 'ABSENT',
           date: {
             gte: new Date(period + '-01T00:00:00.000Z'),
             lt: new Date(new Date(period + '-01T00:00:00.000Z').setMonth(new Date(period + '-01T00:00:00.000Z').getMonth() + 1))
           }
         }
      });

      if (absents > 0) {
         const dailyDeduction = (basicSalary / 22); // Assuming 22 working days
         const deductionAmount = dailyDeduction * absents;
         totalDeduction += deductionAmount;
         items.push({ type: 'DEDUCTION', name: 'Absent Deduction', amount: deductionAmount });
      }

      if (!payroll) {
        payroll = await tx.payroll.create({
          data: {
            company_id: companyId,
            employee_id: employeeId,
            period: period,
            basic_salary: basicSalary,
            total_allowance: 0,
            total_deduction: totalDeduction,
            net_salary: basicSalary - totalDeduction,
            status: 'CALCULATED',
          },
        });
      } else {
        payroll = await tx.payroll.update({
          where: { id: payroll.id },
          data: {
            basic_salary: basicSalary,
            total_allowance: 0,
            total_deduction: totalDeduction,
            net_salary: basicSalary - totalDeduction,
            status: 'CALCULATED',
          }
        });
      }

      if (items.length > 0) {
         await tx.payrollItem.createMany({
            data: items.map(i => ({ ...i, payroll_id: payroll!.id }))
         });
      }

      return this.prisma.payroll.findUnique({ where: { id: payroll.id }, include: { items: true } });
    });
  }

  async approvePayroll(companyId: string, id: string) {
    const p = await this.prisma.payroll.findFirst({ where: { id, company_id: companyId } });
    if (!p) throw new NotFoundException('Payroll not found');
    if (p.status !== 'CALCULATED') throw new BadRequestException('Can only approve CALCULATED payroll');
    return this.prisma.payroll.update({ where: { id }, data: { status: 'APPROVED' } });
  }

  async postPayroll(companyId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.payroll.findFirst({ where: { id, company_id: companyId }, include: { employee: true } });
      if (!p) throw new NotFoundException('Payroll not found');
      if (p.status !== 'APPROVED') throw new BadRequestException('Can only post APPROVED payroll');

      // Create a double-entry journal entry via FinanceTransaction representation
      const account = await tx.cashAccount.findFirst({ where: { company_id: companyId } });
      if (!account) throw new BadRequestException('No default cash account mapped for company');

      // (In real integration, this would touch GlService. For now we use FinanceTransaction to represent the liability)
      await tx.financeTransaction.create({
        data: {
          company_id: companyId,
          cash_account_id: account.id,
          transaction_no: 'PAY-' + Date.now(),
          transaction_type: 'Expense', // Conceptually Salary Payable
          transaction_date: new Date(),
          total_amount: p.net_salary,
          reference_type: 'PAYROLL',
          reference_id: p.id,
          description: 'Payroll liability posted for ' + p.period,
          created_by: 'SYSTEM',
          status: 'PENDING'
        }
      });

      return tx.payroll.update({ where: { id }, data: { status: 'POSTED' } });
    });
  }

  async payPayroll(companyId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.payroll.findFirst({ where: { id, company_id: companyId } });
      if (!p) throw new NotFoundException('Payroll not found');
      if (p.status !== 'POSTED') throw new BadRequestException('Can only pay POSTED payroll');

      // Find pending transaction and clear it
      const f = await tx.financeTransaction.findFirst({ where: { reference_type: 'PAYROLL', reference_id: id } });
      if (f) {
        await tx.financeTransaction.update({ where: { id: f.id }, data: { status: 'COMPLETED' } });
      }

      return tx.payroll.update({ where: { id }, data: { status: 'PAID', paid_date: new Date() } });
    });
  }
}

