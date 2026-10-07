const fs = require('fs');
const path = 'backend/src/hr/hr.service.ts';
let code = fs.readFileSync(path, 'utf8');

const shiftService = `
  // --- SHIFT MANAGEMENT ---
  async getShifts(companyId: string) {
    return this.prisma.shift.findMany({
      where: { company_id: companyId }
    });
  }

  async createShift(data: any) {
    return this.prisma.shift.create({
      data: {
        company_id: data.company_id,
        code: data.code,
        name: data.name,
        start_time: data.start_time,
        end_time: data.end_time,
        grace_period_minutes: parseInt(data.grace_period_minutes) || 15
      }
    });
  }

  async updateShift(id: string, data: any) {
    return this.prisma.shift.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        start_time: data.start_time,
        end_time: data.end_time,
        grace_period_minutes: parseInt(data.grace_period_minutes) || 15
      }
    });
  }

  async deleteShift(id: string) {
    return this.prisma.shift.delete({ where: { id } });
  }

  async setEmployeeShift(employeeId: string, shiftId: string) {
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { default_shift_id: shiftId || null }
    });
  }
`;

code = code.replace(
  /export class HrService \{/,
  'export class HrService {\n' + shiftService
);

fs.writeFileSync(path, code);
console.log('patched hr.service.ts');
