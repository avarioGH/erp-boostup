"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Fingerprint, CheckCircle2, ScanFace, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ 
    firstName: "", 
    lastName: "",
    email: "",
    position: "",
    basicSalary: ""
  })

  // Biometric Modal State
  const [bioModalOpen, setBioModalOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<any>(null)
  const [bioStatus, setBioStatus] = useState<'idle' | 'scanning_right' | 'scanning_left' | 'done'>('idle')

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("erp_token")
      
      const [empRes, depRes] = await Promise.all([
        fetch("https://api.erp.boostup.id/hr/employees", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("https://api.erp.boostup.id/hr/departments", { headers: { "Authorization": `Bearer ${token}` } })
      ])
      
      if (empRes.ok) setEmployees(await empRes.json())
      if (depRes.ok) setDepartments(await depRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("erp_token")
      const res = await fetch("https://api.erp.boostup.id/hr/employees", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          position: formData.position,
          basicSalary: Number(formData.basicSalary)
        })
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({ firstName: "", lastName: "", email: "", position: "", basicSalary: "" })
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const openBioModal = (emp: any) => {
    setSelectedEmp(emp)
    setBioStatus('idle')
    setBioModalOpen(true)
  }

  const startScanning = async () => {
    // Simulate biometric scanning process
    setBioStatus('scanning_right')
    await new Promise(r => setTimeout(r, 2000)) // scan right
    setBioStatus('scanning_left')
    await new Promise(r => setTimeout(r, 2000)) // scan left
    
    // Save to backend
    try {
      const token = localStorage.getItem("erp_token")
      await fetch(`https://api.erp.boostup.id/hr/employees/${selectedEmp.id}/biometric`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          rightThumb: "base64_simulated_right_thumb_template",
          leftThumb: "base64_simulated_left_thumb_template"
        })
      })
      
      setBioStatus('done')
      fetchData() // Refresh list
    } catch (e) {
      console.error(e)
      setBioStatus('idle')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your workforce and biometrics.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSave}>
            <CardHeader>
              <CardTitle>New Employee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Position / Job Title</Label>
                  <Input value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Basic Salary (IDR)</Label>
                <Input type="number" value={formData.basicSalary} onChange={(e) => setFormData({...formData, basicSalary: e.target.value})} required />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No employees found.</p>
          ) : (
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Code</th>
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 text-left font-medium">Position</th>
                    <th className="p-3 text-center font-medium">Biometric</th>
                    <th className="p-3 text-right font-medium">Basic Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 font-medium">{e.employee_code}</td>
                      <td className="p-3">{e.first_name} {e.last_name}</td>
                      <td className="p-3">{e.position || '-'}</td>
                      <td className="p-3 text-center">
                        {e.fingerprint_right_thumb && e.fingerprint_left_thumb ? (
                          <div className="flex items-center justify-center text-emerald-600 gap-1 font-medium bg-emerald-50 px-2 py-1 rounded-md w-fit mx-auto">
                            <CheckCircle2 className="w-4 h-4" />
                            Registered
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => openBioModal(e)}>
                            <Fingerprint className="w-4 h-4" />
                            Register
                          </Button>
                        )}
                      </td>
                      <td className="p-3 text-right">{formatCurrency(e.basic_salary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Biometric Registration Modal */}
      <Dialog open={bioModalOpen} onOpenChange={setBioModalOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Register Biometrics</DialogTitle>
            <DialogDescription className="text-center">
              Enroll thumb prints for {selectedEmp?.first_name} {selectedEmp?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-6 gap-6">
            <div className={`p-6 rounded-full flex items-center justify-center transition-all duration-500 ${
              bioStatus === 'idle' ? 'bg-slate-100 text-slate-400' :
              bioStatus === 'scanning_right' || bioStatus === 'scanning_left' ? 'bg-indigo-100 text-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.3)]' :
              'bg-emerald-100 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}>
              {bioStatus === 'done' ? (
                <CheckCircle2 className="w-16 h-16 animate-in zoom-in" />
              ) : (
                <Fingerprint className={`w-16 h-16 ${bioStatus.includes('scanning') ? 'animate-pulse' : ''}`} />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">
                {bioStatus === 'idle' ? 'Ready to Scan' :
                 bioStatus === 'scanning_right' ? 'Scanning Right Thumb...' :
                 bioStatus === 'scanning_left' ? 'Scanning Left Thumb...' :
                 'Enrollment Complete!'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {bioStatus === 'idle' ? 'Place right thumb on the scanner, followed by the left thumb.' :
                 bioStatus === 'scanning_right' ? 'Please keep right thumb steady on the reader.' :
                 bioStatus === 'scanning_left' ? 'Now place left thumb on the reader.' :
                 'Both thumbs successfully registered and saved to database.'}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            {bioStatus === 'idle' && (
              <Button onClick={startScanning} className="w-full">
                <ScanFace className="w-4 h-4 mr-2" /> Start Registration
              </Button>
            )}
            {bioStatus.includes('scanning') && (
              <Button disabled className="w-full">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
              </Button>
            )}
            {bioStatus === 'done' && (
              <Button onClick={() => setBioModalOpen(false)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Finish
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
