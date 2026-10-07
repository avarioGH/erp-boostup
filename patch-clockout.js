const fs = require('fs');
const path = 'backend/src/hr/hr.service.ts';
let code = fs.readFileSync(path, 'utf8');

const clockOutLogic = `async clockOut(data: any) {
    const { attendanceId, time, notes } = data;
    const checkOutTime = new Date(time);

    const att = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { shift: true }
    });

    let overtimeMins = 0;
    if (att && att.shift && att.shift.end_time) {
      const [h, m] = att.shift.end_time.split(':');
      const shiftEndHour = parseInt(h);
      const shiftEndMin = parseInt(m);
      
      const checkOutHour = checkOutTime.getHours();
      const checkOutMin = checkOutTime.getMinutes();
      
      const checkOutTotalMins = checkOutHour * 60 + checkOutMin;
      const shiftEndTotalMins = shiftEndHour * 60 + shiftEndMin;
      
      // Simplified: if checkOut is later than shift end (assuming same day)
      // For overnight shifts, this requires date difference handling. 
      // A quick fix for same-day shifts:
      if (checkOutTotalMins > shiftEndTotalMins) {
        overtimeMins = checkOutTotalMins - shiftEndTotalMins;
      }
      
      // If check_in is on previous day, or check_out is on next day (overnight)
      if (att.check_in && checkOutTime.getDate() !== att.check_in.getDate()) {
        const diffInMs = checkOutTime.getTime() - att.check_in.getTime();
        const diffInMins = Math.floor(diffInMs / 60000);
        // Calculate expected duration based on shift start and end
        let expectedDuration = shiftEndTotalMins - (parseInt(att.shift.start_time.split(':')[0]) * 60 + parseInt(att.shift.start_time.split(':')[1]));
        if (expectedDuration < 0) expectedDuration += 24 * 60; // overnight shift
        
        if (diffInMins > expectedDuration) {
          overtimeMins = diffInMins - expectedDuration;
        }
      }
    } else {
       // Default 17:00 end time if no shift
       const checkOutHour = checkOutTime.getHours();
       const checkOutMin = checkOutTime.getMinutes();
       const checkOutTotalMins = checkOutHour * 60 + checkOutMin;
       if (checkOutTotalMins > 17 * 60) {
         overtimeMins = checkOutTotalMins - (17 * 60);
       }
    }

    return this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        check_out: checkOutTime,
        notes: notes,
        overtime_minutes: overtimeMins,
      }
    });
  }`;

code = code.replace(/async clockOut\(data: any\) \{[\s\S]*?\}\s*\n\s*async getCalendar/g, clockOutLogic + '\n\n  async getCalendar');

fs.writeFileSync(path, code);
console.log('patched clockOut logic');
