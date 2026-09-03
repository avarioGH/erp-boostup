"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, Banknote } from "lucide-react"
import { useEffect, useState } from "react"

export default function HrDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ employees: 0, presentToday: 0, payrolls: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("erp_token")
        
        const [empRes, attRes, payRes] = await Promise.all([
          fetch("https://api.erp.boostup.id/hr/employees", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("https://api.erp.boostup.id/hr/attendance", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("https://api.erp.boostup.id/hr/payroll", { headers: { "Authorization": `Bearer ${token}` } })
        ])

        const employees = empRes.ok ? await empRes.json() : []
        const attendance = attRes.ok ? await attRes.json() : []
        const payrolls = payRes.ok ? await payRes.json() : []

        const today = new Date().toDateString()
        const presentToday = attendance.filter((a: any) => new Date(a.date).toDateString() === today && a.status === "PRESENT").length

        setStats({
          employees: employees.length || 0,
          presentToday,
          payrolls: payrolls.length || 0
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HR & Payroll Dashboard</h1>
        <p className="text-muted-foreground">Overview of employees, attendance, and salary.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.employees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Clock className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.presentToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Processed Payrolls</CardTitle>
            <Banknote className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.payrolls}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
