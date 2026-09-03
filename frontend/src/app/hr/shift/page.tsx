"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Clock, Calendar, Users, AlertCircle } from "lucide-react"

export default function HrShift() {
  const [activeTab, setActiveTab] = useState("master")

  // Mock Data for Demo
  const [shifts, setShifts] = useState([
    { id: 1, code: "SHF-PAGI", name: "Shift Pagi", startTime: "08:00", endTime: "16:00", active: true },
    { id: 2, code: "SHF-SIANG", name: "Shift Siang", startTime: "14:00", endTime: "22:00", active: true },
    { id: 3, code: "SHF-MALAM", name: "Shift Malam", startTime: "22:00", endTime: "06:00", active: true },
    { id: 4, code: "SHF-OFF", name: "Libur (Off)", startTime: "-", endTime: "-", active: true },
  ])

  const [schedules, setSchedules] = useState([
    { id: 1, employee: "Budi Santoso", department: "Gudang", date: "2026-09-04", shift: "Shift Pagi" },
    { id: 2, employee: "Siti Aminah", department: "Kasir", date: "2026-09-04", shift: "Shift Siang" },
    { id: 3, employee: "Agus Pratama", department: "Keamanan", date: "2026-09-04", shift: "Shift Malam" },
  ])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="w-8 h-8 text-primary" /> Pengaturan Shift
          </h1>
          <p className="text-muted-foreground mt-1">Kelola jam kerja dan jadwal shift pegawai.</p>
        </div>
      </div>

      {/* Demo Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-sm">Mode Pratinjau (Visual Only)</p>
          <p className="text-xs mt-1 opacity-90">Halaman ini adalah pratinjau antarmuka (UI) untuk Modul Shift (Phase 2). Fitur simpan ke database aktif akan tersedia pada update berikutnya.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border shadow-sm">
          <TabsTrigger value="master" className="gap-2"><Clock className="w-4 h-4" /> Master Shift</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2"><Calendar className="w-4 h-4" /> Jadwal Pegawai</TabsTrigger>
        </TabsList>

        <TabsContent value="master">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
              <div>
                <CardTitle>Master Data Shift</CardTitle>
                <CardDescription>Daftar template jam kerja perusahaan.</CardDescription>
              </div>
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Tambah Shift</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-accent/50">
                  <TableRow>
                    <TableHead className="font-semibold">Kode</TableHead>
                    <TableHead className="font-semibold">Nama Shift</TableHead>
                    <TableHead className="font-semibold text-center">Jam Mulai</TableHead>
                    <TableHead className="font-semibold text-center">Jam Selesai</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="text-right font-semibold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((shift) => (
                    <TableRow key={shift.id} className="hover:bg-accent/50">
                      <TableCell className="font-medium text-muted-foreground">{shift.code}</TableCell>
                      <TableCell className="font-bold">{shift.name}</TableCell>
                      <TableCell className="text-center">{shift.startTime}</TableCell>
                      <TableCell className="text-center">{shift.endTime}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">Aktif</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
              <div>
                <CardTitle>Penugasan Shift</CardTitle>
                <CardDescription>Jadwal shift harian pegawai.</CardDescription>
              </div>
              <Button size="sm" className="gap-2"><Users className="w-4 h-4" /> Plotting Jadwal</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-accent/50">
                  <TableRow>
                    <TableHead className="font-semibold">Tanggal</TableHead>
                    <TableHead className="font-semibold">Nama Pegawai</TableHead>
                    <TableHead className="font-semibold">Departemen</TableHead>
                    <TableHead className="font-semibold">Shift Assignment</TableHead>
                    <TableHead className="text-right font-semibold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((sch) => (
                    <TableRow key={sch.id} className="hover:bg-accent/50">
                      <TableCell className="font-medium">{sch.date}</TableCell>
                      <TableCell className="font-bold">{sch.employee}</TableCell>
                      <TableCell className="text-muted-foreground">{sch.department}</TableCell>
                      <TableCell>
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{sch.shift}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"><Edit className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
