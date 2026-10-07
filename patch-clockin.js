const fs = require('fs');
const path = 'backend/src/hr/hr.service.ts';
let code = fs.readFileSync(path, 'utf8');

const clockInLogic = `async clockIn(data: any) {
    const { employeeId, time, notes, companyId } = data;
    const checkInTime = new Date(time);
    
    // Fetch Employee and their Shift
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { shift: true }
    });
    
    let shiftStartHour = 8;
    let shiftStartMin = 0;
    let gracePeriod = 0;
    let shiftId = null;

    if (emp?.shift) {
      shiftId = emp.shift.id;
      const [h, m] = emp.shift.start_time.split(':');
      shiftStartHour = parseInt(h);
      shiftStartMin = parseInt(m);
      gracePeriod = emp.shift.grace_period_minutes || 0;
    }

    const checkInHour = checkInTime.getHours();
    const checkInMin = checkInTime.getMinutes();
    
    const checkInTotalMins = checkInHour * 60 + checkInMin;
    const shiftStartTotalMins = shiftStartHour * 60 + shiftStartMin;
    
    let status = 'PRESENT';
    let lateMinutes = 0;

    if (checkInTotalMins > shiftStartTotalMins + gracePeriod) {
      status = 'LATE';
      lateMinutes = checkInTotalMins - shiftStartTotalMins;
    }

    return this.prisma.attendance.create({
      data: {
        company_id: companyId,
        employee_id: employeeId,
        shift_id: shiftId,
        date: checkInTime,
        status: status,
        check_in: checkInTime,
        notes: notes || '',
        late_minutes: lateMinutes,
      }
    });
  }`;

code = code.replace(/async clockIn\(data: any\) \{[\s\S]*?\}\s*\}\s*async clockOut/g, clockInLogic + '\n\n  async clockOut');

fs.writeFileSync(path, code);
console.log('patched clockIn logic');
