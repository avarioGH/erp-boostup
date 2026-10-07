const fs = require('fs');
const path = 'backend/src/hr/hr.service.ts';
let code = fs.readFileSync(path, 'utf8');

const reportService = `
  async getPerformanceReport(companyId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        company_id: companyId,
        date: { gte: startDate, lt: endDate }
      },
      include: { employee: true }
    });

    const reportMap = new Map();

    attendances.forEach(att => {
      if (!reportMap.has(att.employee_id)) {
        reportMap.set(att.employee_id, {
          employee_id: att.employee_id,
          employee_name: att.employee?.first_name + ' ' + (att.employee?.last_name || ''),
          employee_code: att.employee?.employee_code,
          total_present: 0,
          total_late_minutes: 0,
          total_overtime_minutes: 0,
          late_count: 0
        });
      }

      const stats = reportMap.get(att.employee_id);
      
      if (att.status === 'PRESENT' || att.status === 'LATE') {
         stats.total_present += 1;
      }
      
      if (att.late_minutes && att.late_minutes > 0) {
        stats.total_late_minutes += att.late_minutes;
        stats.late_count += 1;
      }
      
      if (att.overtime_minutes && att.overtime_minutes > 0) {
        stats.total_overtime_minutes += att.overtime_minutes;
      }
    });

    return Array.from(reportMap.values());
  }
`;

code = code.replace(
  /export class HrService \{/,
  'export class HrService {\n' + reportService
);

fs.writeFileSync(path, code);
console.log('patched hr.service.ts with report');
