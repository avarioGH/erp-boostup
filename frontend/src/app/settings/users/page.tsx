"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    modules: [] as string[],
    warehouse_ids: [] as string[]
  })

  const AVAILABLE_MODULES = [
    { id: "dashboard", label: "Dashboard" },
    { id: "finance", label: "Finance" },
    { id: "inventory", label: "Inventory" },
    { id: "hr", label: "HR" },
    { id: "crm", label: "CRM" },
    { id: "settings", label: "Settings" }
  ]

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("token") || localStorage.getItem("erp_token")
    }
    return null
  }

  useEffect(() => {
    const token = getToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload && payload.role) {
          setCurrentUserRole(payload.role)
        }
      } catch (e) {
        console.error("Failed to parse token payload", e)
      }
    }
  }, [])

  const fetchUsers = async () => {
    try {
      const token = getToken()
      const res = await fetch("http://194.233.85.181:3001/users", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.status === 401) {
        window.location.href = "/login"
        return
      }
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const token = getToken()
      const res = await fetch("http://194.233.85.181:3001/inventory/warehouses", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setWarehouses(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchWarehouses()
  }, [])

  const handleCreateAdmin = async () => {
    if (!formData.name || !formData.username || !formData.password || !formData.email) {
      alert("Please fill all required fields")
      return
    }

    try {
      const token = getToken()
      const res = await fetch("http://194.233.85.181:3001/users/admin", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (res.status === 401) {
        window.location.href = "/login"
        return
      }
      
      if (res.ok) {
        setOpen(false)
        fetchUsers()
        setFormData({ name: "", username: "", email: "", password: "", modules: [], warehouse_ids: [] })
      } else {
        const err = await res.json()
        alert(err.message)
      }
    } catch (e) {
      console.error(e)
      alert("Gagal membuat admin")
    }
  }

  const toggleModule = (moduleId: string) => {
    setFormData(prev => {
      if (prev.modules.includes(moduleId)) {
        return { ...prev, modules: prev.modules.filter(m => m !== moduleId) }
      } else {
        return { ...prev, modules: [...prev.modules, moduleId] }
      }
    })
  }

  const toggleWarehouse = (warehouseId: string) => {
    setFormData(prev => {
      if (prev.warehouse_ids.includes(warehouseId)) {
        return { ...prev, warehouse_ids: prev.warehouse_ids.filter(id => id !== warehouseId) }
      } else {
        return { ...prev, warehouse_ids: [...prev.warehouse_ids, warehouseId] }
      }
    })
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Pengguna & Akses</h2>
        
        {currentUserRole === "Owner" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 text-white">+ Create Admin</Button>} />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Buat Akun Admin Baru</DialogTitle>
                <DialogDescription>
                  Tambahkan admin baru dan atur akses modul serta gudang yang diizinkan.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-2">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input 
                      value={formData.username} 
                      onChange={e => setFormData({...formData, username: e.target.value})} 
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                      placeholder="Username unik"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
                    placeholder="Masukkan password aman"
                  />
                </div>
                
                <div className="space-y-3 pt-4 border-t">
                  <Label className="font-semibold text-slate-900 dark:text-white">Akses Gudang (RBAC)</Label>
                  <p className="text-xs text-slate-500">Pilih gudang mana saja yang boleh dilihat dan dikelola oleh admin ini.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {warehouses.length > 0 ? warehouses.map(wh => (
                      <div key={wh.id} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        <Checkbox 
                          id={`wh-${wh.id}`} 
                          checked={formData.warehouse_ids.includes(wh.id)}
                          onCheckedChange={() => toggleWarehouse(wh.id)}
                        />
                        <label
                          htmlFor={`wh-${wh.id}`}
                          className="text-sm font-medium leading-none cursor-pointer text-slate-700 dark:text-slate-300"
                        >
                          {wh.name}
                        </label>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">Belum ada gudang terdaftar.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="font-semibold text-slate-900 dark:text-white">Akses Modul</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_MODULES.map(mod => (
                      <div key={mod.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`mod-${mod.id}`} 
                          checked={formData.modules.includes(mod.id)}
                          onCheckedChange={() => toggleModule(mod.id)}
                        />
                        <label
                          htmlFor={`mod-${mod.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {mod.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleCreateAdmin} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">Simpan Admin</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna Aktif</CardTitle>
          <CardDescription>Kelola anggota tim dan hak akses mereka.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Peran (Role)</TableHead>
                <TableHead>Akses Gudang</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-4">Memuat data...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-4">Tidak ada pengguna ditemukan</TableCell></TableRow>
              ) : users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={user.role?.name === "Owner" ? "default" : "secondary"}>
                      {user.role?.name || "User"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.role?.name === "Owner" ? (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Semua Akses</Badge>
                      ) : user.warehouse_accesses && user.warehouse_accesses.length > 0 ? (
                        user.warehouse_accesses.map((wa: any) => (
                          <Badge key={wa.warehouse?.id} variant="outline" className="bg-slate-50">
                            {wa.warehouse?.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">Tidak ada akses</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status ? "outline" : "destructive"} className={user.status ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""}>
                      {user.status ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
