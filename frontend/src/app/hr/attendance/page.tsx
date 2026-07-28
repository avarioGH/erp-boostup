"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Fingerprint, UserCheck } from "lucide-react"
import { api } from "@/lib/api"

export default function HrAttendance() {
  const [attendances, setAttendances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [employeeCode, setEmployeeCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const fetchAttendances = async () => {
    try {
      setLoading(true)
      const res = await api.get('/hr/attendance')
      setAttendances(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendances()
  }, [])

  const handleManualClock = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError("")
    setSuccess("")
    
    try {
      await api.post('/hr/attendance/clock', { employee_code: employeeCode })
      setSuccess(`Berhasil clock-in/out untuk ${employeeCode}`)
      setEmployeeCode("")
      fetchAttendances()
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal melakukan absensi. Pastikan kode pegawai benar.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Absensi Pegawai</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau kehadiran harian dan integrasi mesin biometrik (Fingerprint).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-1 border-slate-200 dark:border-slate-800 shadow-sm border-t-4 border-t-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-indigo-500" />
              Clock In / Clock Out Manual
            </CardTitle>
            <CardDescription>
              Simulasi absen manual jika mesin biometrik bermasalah atau untuk staf remote.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualClock} className="space-y-4">
              {error && <div className="text-sm text-rose-500 p-2 bg-rose-50 dark:bg-rose-900/30 rounded">{error}</div>}
              {success && <div className="text-sm text-emerald-500 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded">{success}</div>}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Kode Pegawai</label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input 
                    required 
                    placeholder="Contoh: EMP-12345" 
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    className="pl-9 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>
              <Button type="submit" disabled={processing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                {processing ? "Memproses..." : <><Clock className="w-4 h-4 mr-2"/> Absen Sekarang</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle>Riwayat Absensi</CardTitle>
              <CardDescription>Log kehadiran harian (dari web dan fingerprint)</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Memuat data...</div>
            ) : attendances.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Belum ada data absensi.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead>Pegawai</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead>Jam Keluar</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendances.map((att) => (
                      <TableRow key={att.id}>
                        <TableCell>
                          <div className="font-medium text-slate-900 dark:text-slate-100">{att.employee?.first_name} {att.employee?.last_name}</div>
                          <div className="text-xs text-slate-500">{att.employee?.employee_code}</div>
                        </TableCell>
                        <TableCell>{new Date(att.date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>
                          {att.check_in ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <Clock className="w-3 h-3" /> {new Date(att.check_in).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {att.check_out ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                              <Clock className="w-3 h-3" /> {new Date(att.check_out).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          ) : <span className="text-slate-400 italic">Belum</span>}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            att.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {att.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
