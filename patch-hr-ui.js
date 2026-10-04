const fs = require('fs');

const attendancePage = `
"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import api from '@/lib/api'
import { CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

export default function HrAttendance() {
  const [attendances, setAttendances] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [employeeId, setEmployeeId] = useState("")
  const [clockTime, setClockTime] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      const empRes = await api.get('/hr/employees')
      setEmployees(empRes.data)
      const attRes = await api.get('/hr/attendance') // Assuming this exists or returns list
      setAttendances(attRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleClockIn = async () => {
    if (!employeeId || !clockTime) return alert("Pilih Karyawan dan Jam")
    try {
      // Mocking today's date with the selected time
      const today = new Date()
      const [h, m] = clockTime.split(':')
      today.setHours(parseInt(h), parseInt(m), 0)

      await api.post('/hr/attendance/clock-in', {
        employeeId,
        time: today.toISOString()
      })
      alert("Berhasil Clock In")
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kehadiran (Absensi)</h1>
          <p className="text-muted-foreground">Kelola jam kerja dan pantau keterlambatan karyawan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Manual Clock In</CardTitle>
            <CardDescription>Input absensi manual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Karyawan</Label>
              <select className="w-full border p-2 rounded-md" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                <option value="">-- Pilih Karyawan --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Jam Masuk</Label>
              <Input type="time" value={clockTime} onChange={e => setClockTime(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleClockIn}>Simpan Absen Masuk</Button>
            <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
              * Jam Masuk standar adalah 08:00. Jika lebih dari jam 8, status otomatis LATE (Terlambat).
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Riwayat Absensi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.slice(0, 10).map((att: any) => (
                  <TableRow key={att.id}>
                    <TableCell>{new Date(att.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{att.employee?.first_name} {att.employee?.last_name}</TableCell>
                    <TableCell>{att.check_in ? new Date(att.check_in).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>{att.check_out ? new Date(att.check_out).toLocaleTimeString() : '-'}</TableCell>
                    <TableCell>
                      {att.status === 'LATE' ? (
                        <Badge variant="destructive" className="flex w-fit items-center gap-1"><AlertCircle className="w-3 h-3"/> Terlambat</Badge>
                      ) : att.status === 'PRESENT' ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 flex w-fit items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Hadir</Badge>
                      ) : (
                        <Badge variant="outline">{att.status}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {attendances.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Belum ada data absensi.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
`;

const payrollPage = `
"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import api from '@/lib/api'
import { Banknote, FileText } from 'lucide-react'

export default function HrPayroll() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPayrolls = async () => {
    try {
      setLoading(true)
      const res = await api.get('/hr/payroll')
      setPayrolls(res.data || [])
    } catch(err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayrolls()
  }, [])

  const handleGenerate = async () => {
    if (!period) return alert("Pilih periode!")
    try {
      setLoading(true)
      await api.post('/hr/payroll/generate', { period })
      alert("Payroll berhasil di-generate!")
      fetchPayrolls()
    } catch(err) {
      console.error(err)
      alert("Gagal generate payroll")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Penggajian (Payroll)</h1>
          <p className="text-muted-foreground">Generate slip gaji otomatis berdasarkan data absensi (potongan telat/absen).</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} />
          <Button onClick={handleGenerate} disabled={loading}>
            <Banknote className="w-4 h-4 mr-2" /> Generate Payroll
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Penggajian</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Periode</TableHead>
                <TableHead>Karyawan</TableHead>
                <TableHead>Gaji Pokok</TableHead>
                <TableHead>Potongan</TableHead>
                <TableHead>Gaji Bersih</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrolls.filter((p: any) => p.period === period).map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{p.period}</TableCell>
                  <TableCell className="font-medium">{p.employee?.first_name}</TableCell>
                  <TableCell>Rp {p.basic_salary?.toLocaleString()}</TableCell>
                  <TableCell className="text-rose-500">Rp {p.total_deduction?.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-emerald-600">Rp {p.net_pay?.toLocaleString()}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-1"/> Slip</Button>
                  </TableCell>
                </TableRow>
              ))}
              {payrolls.filter((p: any) => p.period === period).length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Tidak ada payroll untuk periode {period}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
`;

fs.writeFileSync('frontend/src/app/hr/attendance/page.tsx', attendancePage);
fs.writeFileSync('frontend/src/app/hr/payroll/page.tsx', payrollPage);
console.log('Frontend HR pages created');
