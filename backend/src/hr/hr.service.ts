import { Injectable } from '@nestjs/common';
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
        employee_code: data.employeeCode || `EMP-${Date.now()}`,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        position: data.position,
        status: 'ACTIVE',
        basic_salary: data.basicSalary || 0,
        join_date: new Date(),
      },
    });
  }

  async registerBiometric(companyId: string, employeeId: string, rightThumb: string, leftThumb: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, company_id: companyId }
    });
    
    if (!employee) throw new Error("Employee not found");
    
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        fingerprint_right_thumb: rightThumb,
        fingerprint_left_thumb: leftThumb
      }
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
    // Cari pegawai berdasarkan employee_code dan company_id
    const employee = await this.prisma.employee.findUnique({
      where: {
        company_id_employee_code: {
          company_id: companyId,
          employee_code: data.employee_code
        }
      }
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    const clockTime = data.timestamp ? new Date(data.timestamp) : new Date();
    // Gunakan tanggal tanpa jam sebagai kunci pencarian hari ini
    const todayStr = clockTime.toISOString().split('T')[0];
    const startDate = new Date(todayStr + "T00:00:00.000Z");
    const endDate = new Date(todayStr + "T23:59:59.999Z");

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        employee_id: employee.id,
        date: {
          gte: startDate,
          lte: endDate,
        }
      }
    });

    if (existingAttendance) {
      // Jika sudah check-in, anggap ini check-out
      return this.prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          check_out: clockTime,
          status: 'PRESENT', // update status as needed
        }
      });
    } else {
      // Belum ada data hari ini, berarti check-in
      return this.prisma.attendance.create({
        data: {
          employee_id: employee.id,
          date: clockTime,
          status: 'PRESENT', // default
          check_in: clockTime,
        }
      });
    }
  }

  // Payroll
  async getPayrolls(companyId: string) {
    return this.prisma.payroll.findMany({
      where: { employee: { company_id: companyId } },
      include: { employee: true, items: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async createPayroll(data: any) {
    return this.prisma.$transaction(async (tx) => {
      let totalAllowance = 0;
      let totalDeduction = 0;

      if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
          if (item.type === 'ALLOWANCE') totalAllowance += Number(item.amount);
          if (item.type === 'DEDUCTION') totalDeduction += Number(item.amount);
        });
      }

      const basicSalary = Number(data.basicSalary || 0);
      const netSalary = basicSalary + totalAllowance - totalDeduction;

      const payroll = await tx.payroll.create({
        data: {
          employee_id: data.employeeId,
          period: data.period,
          basic_salary: basicSalary,
          total_allowance: totalAllowance,
          total_deduction: totalDeduction,
          net_salary: netSalary,
          status: 'DRAFT',
        },
      });

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await tx.payrollItem.create({
            data: {
              payroll_id: payroll.id,
              type: item.type,
              name: item.name,
              amount: Number(item.amount),
            },
          });
        }
      }

      return payroll;
    });
  }
}
