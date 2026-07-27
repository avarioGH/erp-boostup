"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Users, Shield, Plus, Key, Building2, UserPlus, Save, AlertCircle, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"

export default function UsersSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  
  const [showForm, setShowForm] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    warehouse_ids: [] as string[]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [uRes, wRes] = await Promise.all([
        api.get('/users'),
        api.get('/inventory/warehouses')
      ])
      
      setUsers(uRes.data)
      setWarehouses(wRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleWarehouse = (whId: string) => {
    setFormData(prev => {
      const exists = prev.warehouse_ids.includes(whId)
      if (exists) {
        return { ...prev, warehouse_ids: prev.warehouse_ids.filter(id => id !== whId) }
      } else {
        return { ...prev, warehouse_ids: [...prev.warehouse_ids, whId] }
      }
    })
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError("")
    
    if (formData.warehouse_ids.length === 0) {
      setError("Pilih minimal 1 gudang / lokasi yang bisa diakses user ini.")
      setProcessing(false)
      return
    }

    try {
      await api.post('/users/admin', formData)
      setSuccess("Pengguna Admin berhasil dibuat dan diberi akses!")
      setShowForm(false)
      fetchData()
      
      // Reset form
      setFormData({ username: "", name: "", email: "", password: "", warehouse_ids: [] })
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal membuat pengguna. Pastikan Anda login sebagai Owner.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Pengguna & Role</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola akun staf dan batasi akses mereka ke gudang (RBAC).</p>
          </div>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <UserPlus className="w-4 h-4" /> Tambah Staf Baru
          </Button>
        )}
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-lg flex items-center gap-3 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{success}</p>
        </div>
      )}

      {showForm ? (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden border-t-4 border-t-blue-500">
          <form onSubmit={handleCreateUser}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" /> Buat Akun Admin / Kasir
              </CardTitle>
              <CardDescription>Akun yang dibuat akan memiliki batasan akses sesuai pilihan gudang (Role Based Access Control).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-4 rounded-lg flex items-center gap-3 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-medium text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2"><Users className="w-4 h-4 text-slate-500"/> Data Pengguna</h3>
                  
                  <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input 
                      required placeholder="Misal: Budi Santoso" 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="bg-white dark:bg-slate-950"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Username Login <span className="text-rose-500">*</span></Label>
                    <Input 
                      required placeholder="budisantoso" 
                      value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                      className="bg-white dark:bg-slate-950 font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email" placeholder="budi@perusahaan.com" 
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      className="bg-white dark:bg-slate-950"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Password Awal <span className="text-rose-500">*</span></Label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input 
                        required type="password" placeholder="••••••••" 
                        value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                        className="pl-9 bg-white dark:bg-slate-950"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500"/> Akses Lokasi (Gudang / Cabang)</h3>
                  <p className="text-sm text-slate-500">Pilih cabang mana saja yang dapat diakses oleh akun ini. Mereka tidak akan bisa melihat transaksi di cabang lain.</p>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 max-h-[300px] overflow-y-auto">
                    {warehouses.length === 0 ? (
                      <div className="text-center text-sm text-slate-500 py-4">Belum ada gudang terdaftar.</div>
                    ) : (
                      warehouses.map(wh => (
                        <div key={wh.id} className="flex flex-row items-start space-x-3 space-y-0 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                          <Checkbox 
                            id={`wh-${wh.id}`} 
                            checked={formData.warehouse_ids.includes(wh.id)}
                            onCheckedChange={() => handleToggleWarehouse(wh.id)}
                            className="mt-1"
                          />
                          <div className="space-y-1 leading-none">
                            <Label htmlFor={`wh-${wh.id}`} className="font-bold cursor-pointer">{wh.name}</Label>
                            <p className="text-xs text-slate-500">{wh.code} — {wh.address || 'Tidak ada alamat'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] gap-2">
                  {processing ? "Memproses..." : <><Save className="w-4 h-4"/> Simpan Akun</>}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      ) : (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle>Daftar Staff & Karyawan Aktif</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 text-center text-slate-500">Memuat daftar pengguna...</div>
            ) : users.length === 0 ? (
              <div className="py-20 text-center text-slate-500">Belum ada pengguna.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => (
                  <div key={user.id} className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {user.name} 
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            user.role?.name === 'Owner' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {user.role?.name || 'Staff'}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5">@{user.username} {user.email && `• ${user.email}`}</div>
                      </div>
                    </div>
                    
                    <div className="sm:text-right">
                      <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Akses Cabang</div>
                      {user.role?.name === 'Owner' ? (
                        <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Seluruh Cabang (Superadmin)</div>
                      ) : (
                        <div className="flex flex-wrap sm:justify-end gap-1">
                          {user.warehouse_accesses?.length > 0 ? (
                            user.warehouse_accesses.map((acc: any, i: number) => (
                              <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs font-medium border border-slate-200 dark:border-slate-700">
                                {acc.warehouse?.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-rose-500 font-medium italic">Tidak ada akses</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
