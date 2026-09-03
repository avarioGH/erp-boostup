"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form Data
  const [employeeId, setEmployeeId] = useState("")
  const [period, setPeriod] = useState("")
  const [basicSalary, setBasicSalary] = useState("")
  const [allowance, setAllowance] = useState("")
  const [deduction, setDeduction] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("erp_token")
      
      const [payRes, empRes] = await Promise.all([
        fetch("https://api.erp.boostup.id/hr/payroll", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("https://api.erp.boostup.id/hr/employees", { headers: { "Authorization": `Bearer ${token}` } })
      ])
      
      if (payRes.ok) setPayrolls(await payRes.json())
      if (empRes.ok) setEmployees(await empRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // When employee changes, auto-fill their basic salary
  useEffect(() => {
    if (employeeId) {
      const emp = employees.find(e => e.id === employeeId)
      if (emp) {
        setBasicSalary(emp.basic_salary)
      }
    }
  }, [employeeId, employees])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("erp_token")
      const items = []
      if (Number(allowance) > 0) items.push({ type: "ALLOWANCE", name: "General Allowance", amount: Number(allowance) })
      if (Number(deduction) > 0) items.push({ type: "DEDUCTION", name: "General Deduction", amount: Number(deduction) })
      
      const res = await fetch("https://api.erp.boostup.id/hr/payroll", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          employeeId,
          period,
          basicSalary,
          items
        })
      })
      if (res.ok) {
        setShowForm(false)
        setEmployeeId("")
        setPeriod("")
        setBasicSalary("")
        setAllowance("")
        setDeduction("")
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground">Process employee salaries and generate payslips.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Process Payroll
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSave}>
            <CardHeader>
              <CardTitle>Generate Payslip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={employeeId} onValueChange={(val) => setEmployeeId(val || "")} required>
                    <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Period (e.g., 2026-07)</Label>
                  <Input value={period} onChange={(e) => setPeriod(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Basic Salary (IDR)</Label>
                <Input type="number" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Allowances (+)</Label>
                  <Input type="number" value={allowance} onChange={(e) => setAllowance(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Total Deductions (-)</Label>
                  <Input type="number" value={deduction} onChange={(e) => setDeduction(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Process</Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : payrolls.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No payroll records found.</p>
          ) : (
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Period</th>
                    <th className="p-3 text-left font-medium">Employee</th>
                    <th className="p-3 text-right font-medium">Basic Salary</th>
                    <th className="p-3 text-right font-medium">Net Salary</th>
                    <th className="p-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 font-medium">{p.period}</td>
                      <td className="p-3">{p.employee?.first_name} {p.employee?.last_name}</td>
                      <td className="p-3 text-right">{formatCurrency(p.basic_salary)}</td>
                      <td className="p-3 text-right font-bold text-primary">{formatCurrency(p.net_salary)}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
