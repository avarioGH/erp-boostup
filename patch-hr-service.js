const fs = require('fs');
let c = fs.readFileSync('backend/src/hr/hr.service.ts', 'utf8');

const newMethods = `
  // --- ATTENDANCE (CLOCK IN / OUT) ---
  async clockIn(data: any) {
    const { employeeId, time, notes, companyId } = data;
    const checkInTime = new Date(time);
    
    // Check if after 08:00
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    let status = 'PRESENT';
    if (hours > 8 || (hours === 8 && minutes > 0)) {
      status = 'LATE';
    }

    return this.prisma.attendance.create({
      data: {
        company_id: companyId,
        employee_id: employeeId,
        date: checkInTime,
        status: status,
        check_in: checkInTime,
        notes: notes || '',
      }
    });
  }

  async clockOut(data: any) {
    const { attendanceId, time, notes } = data;
    const checkOutTime = new Date(time);

    return this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        check_out: checkOutTime,
        notes: notes,
      }
    });
  }

  async getCalendar(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    return this.prisma.attendance.findMany({
      where: {
        employee_id: employeeId,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { date: 'asc' }
    });
  }

  // --- PAYROLL ---
  async generatePayroll(companyId: string, period: string) {
    // period format: "YYYY-MM"
    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const employees = await this.prisma.employee.findMany({
      where: { company_id: companyId, status: 'ACTIVE' },
      include: {
        attendances: {
          where: {
            date: { gte: startDate, lt: endDate }
          }
        }
      }
    });

    const results = [];
    for (const emp of employees) {
      let lateCount = 0;
      let absentCount = 0;
      let presentCount = 0;

      for (const att of emp.attendances) {
        if (att.status === 'LATE') lateCount++;
        else if (att.status === 'ABSENT') absentCount++;
        else if (att.status === 'PRESENT') presentCount++;
      }

      // Base generation logic
      // In a real system, you'd calculate daily rate based on 22 working days or similar
      // Here we just use basic_salary directly and maybe deduct for absence/lates.
      
      const basicSalary = emp.basic_salary || 0;
      
      // We can assume denda telat = 50.000, absen = 100.000 for example, or 0 if not needed yet.
      const deductionLate = lateCount * 50000;
      const deductionAbsent = absentCount * 100000;
      const totalDeduction = deductionLate + deductionAbsent;
      
      const netPay = basicSalary - totalDeduction;

      // Ensure payroll for this period doesn't exist yet
      let existing = await this.prisma.payroll.findFirst({
        where: { employee_id: emp.id, period: period }
      });

      if (!existing) {
        const payroll = await this.prisma.payroll.create({
          data: {
            company_id: companyId,
            employee_id: emp.id,
            period: period,
            basic_salary: basicSalary,
            total_allowance: 0,
            total_deduction: totalDeduction,
            net_pay: netPay > 0 ? netPay : 0,
            status: 'DRAFT'
          }
        });

        if (deductionLate > 0) {
          await this.prisma.payrollItem.create({
            data: {
              payroll_id: payroll.id,
              type: 'DEDUCTION',
              name: \`Potongan Keterlambatan (\${lateCount}x)\`,
              amount: deductionLate
            }
          });
        }
        if (deductionAbsent > 0) {
          await this.prisma.payrollItem.create({
            data: {
              payroll_id: payroll.id,
              type: 'DEDUCTION',
              name: \`Potongan Absen (\${absentCount}x)\`,
              amount: deductionAbsent
            }
          });
        }

        results.push(payroll);
      }
    }

    return results;
  }
`;

if (!c.includes('clockIn(')) {
  c = c.replace(/export class HrService \{/, 'export class HrService {\n' + newMethods);
  fs.writeFileSync('backend/src/hr/hr.service.ts', c);
  console.log('Added HR methods to service');
} else {
  console.log('Methods already exist');
}
