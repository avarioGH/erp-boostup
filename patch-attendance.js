const fs = require('fs');
const path = 'frontend/src/app/hr/attendance/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace states
code = code.replace(
  'const [clockTime, setClockTime] = useState("")',
  'const [inDate, setInDate] = useState("");\n  const [inTime, setInTime] = useState("");\n  const [outDate, setOutDate] = useState("");\n  const [outTime, setOutTime] = useState("");'
);

// Replace handleClockIn with handleSaveAttendance
const handleLogic = `const handleSaveAttendance = async () => {
    if (!employeeId || !inDate || !inTime) return alert("Karyawan, Tgl Masuk, dan Jam Masuk wajib diisi")
    try {
      const checkInDate = new Date(inDate + 'T' + inTime + ':00');
      const res = await api.post('/hr/attendance/clock-in', {
        employeeId,
        time: checkInDate.toISOString()
      });
      
      const attendanceId = res.data?.id;

      if (outDate && outTime && attendanceId) {
         const checkOutDate = new Date(outDate + 'T' + outTime + ':00');
         await api.post('/hr/attendance/clock-out', {
           attendanceId,
           time: checkOutDate.toISOString()
         });
      }

      alert("Berhasil menyimpan absensi manual");
      setInDate(""); setInTime(""); setOutDate(""); setOutTime("");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Gagal: " + (err.response?.data?.message || err.message));
    }
  }`;

code = code.replace(
  /const handleClockIn = async \(\) => \{[\s\S]*?\}\n\s*\}\n/,
  handleLogic + '\n'
);

// Replace form UI
const formUI = `<CardTitle>Input Absensi Manual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Karyawan</Label>
                <select className="w-full p-2 rounded-md border bg-background" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                  <option value="">-- Pilih Karyawan --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Tgl Masuk</Label>
                  <Input type="date" value={inDate} onChange={e => setInDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Jam Masuk</Label>
                  <Input type="time" value={inTime} onChange={e => setInTime(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Tgl Keluar (Ops)</Label>
                  <Input type="date" value={outDate} onChange={e => setOutDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Jam Keluar</Label>
                  <Input type="time" value={outTime} onChange={e => setOutTime(e.target.value)} />
                </div>
              </div>
              <Button className="w-full" onClick={handleSaveAttendance}>Simpan Absensi</Button>
              <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                * Tgl & Jam keluar opsional jika belum pulang.
              </div>
            </CardContent>`;

code = code.replace(
  /<CardTitle>Manual Clock In<\/CardTitle>[\s\S]*?<div className="text-xs text-muted-foreground mt-2 border-t pt-2">[\s\S]*?<\/div>\s*<\/CardContent>/,
  formUI
);

// We need to check if there is an issue with the regex. Let's make sure it replaced everything correctly.
fs.writeFileSync(path, code);
console.log('patched attendance form');
