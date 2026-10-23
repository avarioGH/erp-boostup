"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Building2, Users, Save, Plus, Shield, UserPlus, 
  Trash2, AlertCircle, Key, CheckCircle2, LayoutDashboard,
  Edit2, ShoppingCart, UserCheck
} from "lucide-react"
import { ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"

const AVAILABLE_MODULES = [
  { id: 'inventory', name: 'Inventaris & Gudang (Beli Ikan, Stok, Inflow)' },
  { id: 'pos', name: 'Penjualan (Kasir POS, Sales Order, DO)' },
  { id: 'crm', name: 'CRM & Pelanggan (Data Pelanggan, Piutang, Kompensasi)' },
  { id: 'finance', name: 'Keuangan (Kas, Hutang AP, Pengeluaran)' },
  { id: 'reports', name: 'Laporan (Stok, POS, Sales, Profit)' },
  { id: 'hr', name: 'HR & Absensi (Pegawai, Gaji)' }
];

export default function UsersSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  
  const [showForm, setShowForm] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role_name: "Kasir",
    warehouse_ids: [] as string[],
    modules: ['inventory', 'pos', 'crm', 'finance'] as string[]
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

  const applyPreset = (preset: 'kasir' | 'admin' | 'full') => {
    if (preset === 'kasir') {
      setFormData(prev => ({
        ...prev,
        role_name: 'Kasir',
        modules: ['inventory', 'pos', 'crm', 'finance']
      }))
    } else if (preset === 'admin') {
      setFormData(prev => ({
        ...prev,
        role_name: 'Admin',
        modules: ['inventory', 'pos', 'crm', 'finance', 'reports']
      }))
    } else if (preset === 'full') {
      setFormData(prev => ({
        ...prev,
        role_name: 'Admin',
        modules: AVAILABLE_MODULES.map(m => m.id)
      }))
    }
  }

  const handleToggleWarehouse = (whId: string) => {
    setFormData(prev => {
      if (prev.warehouse_ids.includes(whId)) {
        return { ...prev, warehouse_ids: prev.warehouse_ids.filter(id => id !== whId) }
      } else {
        return { ...prev, warehouse_ids: [...prev.warehouse_ids, whId] }
      }
    })
  }

  const handleToggleModule = (moduleId: string) => {
    setFormData(prev => {
      if (prev.modules.includes(moduleId)) {
        return { ...prev, modules: prev.modules.filter(id => id !== moduleId) }
      } else {
        return { ...prev, modules: [...prev.modules, moduleId] }
      }
    })
  }

  const handleOpenCreate = () => {
    setEditingUserId(null)
    setFormData({
      username: "",
      name: "",
      email: "",
      password: "",
      role_name: "Kasir",
      warehouse_ids: warehouses.length > 0 ? [warehouses[0].id] : [],
      modules: ['inventory', 'pos', 'crm', 'finance']
    })
    setShowForm(true)
  }

  const handleOpenEdit = (user: any) => {
    setEditingUserId(user.id)
    setFormData({
      username: user.username,
      name: user.name || "",
      email: user.email || "",
      password: "",
      role_name: user.role?.name || "Kasir",
      warehouse_ids: user.warehouse_accesses?.map((w: any) => w.warehouse?.id).filter(Boolean) || [],
      modules: user.accessible_modules || ['inventory', 'pos', 'crm', 'finance']
    })
    setShowForm(true)
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun @${username}?`)) return
    try {
      setProcessing(true)
      await api.delete(`/users/${userId}`)
      setSuccess(`Akun @${username} berhasil dihapus!`)
      fetchData()
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      alert((err.response?.data?.error?.message || err.response?.data?.message) || "Gagal menghapus pengguna.")
    } finally {
      setProcessing(false)
    }
  }

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError("")
    
    if (formData.warehouse_ids.length === 0) {
      setError("Pilih minimal 1 cabang/gudang yang dapat diakses pengguna ini.")
      setProcessing(false)
      return
    }

    try {
      if (editingUserId) {
        await api.patch(`/users/${editingUserId}`, formData)
        setSuccess(`Akun ${formData.name || formData.username} berhasil diperbarui!`)
      } else {
        await api.post('/users/admin', formData)
        setSuccess(`Akun ${formData.role_name} (${formData.username}) berhasil dibuat dan diberi akses!`)
      }
      setShowForm(false)
      fetchData()
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      setError((err.response?.data?.error?.message || err.response?.data?.message) || "Gagal memproses pengguna.")
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Pengguna & Hak Akses (Role)</h1>
            <p className="text-muted-foreground mt-1">Kelola staf Kasir, Admin, atur hak akses modul (Beli Ikan, POS, Pelanggan, Hutang/Piutang) & lokasi gudang.</p>
          </div>
        </div>
        {!showForm && (
          <Button onClick={handleOpenCreate} className="gap-2 bg-primary text-primary-foreground font-semibold">
            <UserPlus className="w-4 h-4" /> Tambah Staf Baru
          </Button>
        )}
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-primary dark:text-primary p-4 rounded-lg flex items-center gap-3 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{success}</p>
        </div>
      )}

      {showForm ? (
        <Card className="border-border shadow-sm overflow-hidden border-t-4 border-t-primary">
          <form onSubmit={handleSubmitUser}>
            <CardHeader className="bg-muted/20 border-b border-border/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Shield className="w-5 h-5 text-primary" /> 
                    {editingUserId ? `Edit Hak Akses Akun: @${formData.username}` : 'Buat Akun Staf (Kasir / Admin)'}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Atur izin akses modul kasir (Pembelian Ikan nelayan, POS retail, Data pelanggan, dan Hutang/Piutang).
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground">Template Cepat:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset('kasir')}
                    className="px-2.5 py-1 text-xs rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-200 transition-colors"
                  >
                    Preset Kasir (Ikan + POS + Utang)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('admin')}
                    className="px-2.5 py-1 text-xs rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-200 transition-colors"
                  >
                    Preset Admin Lengkap
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-4 rounded-lg flex items-center gap-3 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-medium text-sm">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-base border-b pb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary"/> Data Profil Staf
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>Peran / Role <span className="text-rose-500">*</span></Label>
                    <select
                      value={formData.role_name}
                      onChange={e => setFormData({ ...formData, role_name: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring font-medium"
                    >
                      <option value="Kasir">Kasir (Operasional Kasir & Penjualan/Pembelian)</option>
                      <option value="Admin">Admin (Administrator Toko / Gudang)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Nama Lengkap Staf <span className="text-rose-500">*</span></Label>
                    <Input 
                      required placeholder="Misal: Kasir Toko Ikan (Siti)" 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="bg-card"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Username Login <span className="text-rose-500">*</span></Label>
                    <Input 
                      required 
                      disabled={!!editingUserId}
                      placeholder="kasir_ikan" 
                      value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                      className="bg-card font-mono text-sm"
                    />
                    {editingUserId && <p className="text-[11px] text-muted-foreground">Username tidak dapat diubah setelah dibuat.</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Email (Opsional)</Label>
                    <Input 
                      type="email" placeholder="kasir@boostup.id" 
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      className="bg-card"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{editingUserId ? 'Ganti Password (Kosongkan jika tetap)' : 'Password Awal Login'} <span className={editingUserId ? '' : 'text-rose-500'}>{editingUserId ? '' : '*'}</span></Label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        required={!editingUserId} 
                        type="password" 
                        placeholder={editingUserId ? "Biarkan kosong bila tidak ingin mengganti" : "••••••••"} 
                        value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                        className="pl-9 bg-card"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-base border-b pb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500"/> Akses Cabang / Gudang
                  </h3>
                  <p className="text-xs text-muted-foreground">Pilih cabang toko / gudang yang diizinkan untuk akun kasir ini.</p>
                  
                  <div className="bg-muted/40 rounded-xl border border-border p-3 space-y-2 max-h-[300px] overflow-y-auto">
                    {warehouses.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-4">Belum ada gudang terdaftar.</div>
                    ) : (
                      warehouses.map(wh => (
                        <div key={wh.id} className="flex flex-row items-start space-x-3 space-y-0 p-2.5 rounded-lg hover:bg-muted/50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-border">
                          <Checkbox 
                            id={`wh-${wh.id}`} 
                            checked={formData.warehouse_ids.includes(wh.id)}
                            onCheckedChange={() => handleToggleWarehouse(wh.id)}
                            className="mt-1"
                          />
                          <div className="space-y-0.5 leading-none">
                            <Label htmlFor={`wh-${wh.id}`} className="font-bold cursor-pointer text-sm">{wh.name}</Label>
                            <p className="text-xs text-muted-foreground">{wh.code} — {wh.address || 'Utama'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-emerald-500"/> Hak Akses Modul Aplikasi
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pilih fitur dan menu yang dapat diakses oleh akun ini. Centang modul di bawah agar staf kasir dapat menjalankan tugasnya.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE_MODULES.map(mod => {
                    const isChecked = formData.modules.includes(mod.id);
                    return (
                      <div 
                        key={mod.id} 
                        onClick={() => handleToggleModule(mod.id)}
                        className={`flex flex-row items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-primary/5 border-primary/40 shadow-xs' 
                            : 'bg-muted/30 border-border hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox 
                          id={`mod-${mod.id}`} 
                          checked={isChecked}
                          onCheckedChange={() => handleToggleModule(mod.id)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`mod-${mod.id}`} className="font-bold cursor-pointer block text-sm">
                            {mod.name.split(' (')[0]}
                          </Label>
                          <span className="text-[11px] text-muted-foreground block">
                            {mod.name.includes('(') ? `(${mod.name.split(' (')[1]}` : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 rounded-lg text-xs space-y-1 text-muted-foreground">
                  <p className="font-semibold text-blue-900 dark:text-blue-300">💡 Rekomendasi Kasir Toko Ikan:</p>
                  <p>Pastikan <strong>Inventaris & Gudang</strong> (Beli Ikan dari Nelayan), <strong>Penjualan (POS)</strong>, <strong>CRM & Pelanggan</strong> (Daftar Customer), serta <strong>Keuangan</strong> (Hutang Nelayan AP & Piutang Customer AR) dicentang.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border/60">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                <Button type="submit" disabled={processing} className="min-w-[150px] gap-2 font-semibold">
                  {processing ? "Menyimpan..." : <><Save className="w-4 h-4"/> {editingUserId ? 'Simpan Perubahan' : 'Simpan Akun'}</>}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      ) : (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4 border-b border-border/60">
            <CardTitle>Daftar Staf & Akun Kasir Aktif</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 text-center text-muted-foreground">Memuat daftar pengguna...</div>
            ) : users.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">Belum ada pengguna.</div>
            ) : (
              <div className="divide-y divide-border">
                {users.map((user) => (
                  <div key={user.id} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          {user.name} 
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            user.role?.name === 'Owner' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                              : user.role?.name === 'Kasir'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {user.role?.name || 'Staff'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          @{user.username} {user.email && `• ${user.email}`}
                        </div>

                        {/* Modul Badge */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.role?.name === 'Owner' ? (
                            <span className="text-[11px] text-muted-foreground font-medium italic">Akses Penuh Semua Modul</span>
                          ) : (user.accessible_modules && user.accessible_modules.length > 0) ? (
                            user.accessible_modules.map((m: string) => (
                              <span key={m} className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-semibold border">
                                {m.toUpperCase()}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-amber-600 font-medium italic">Belum ada modul dipilih</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:text-right">
                      <div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Akses Cabang</div>
                        {user.role?.name === 'Owner' ? (
                          <div className="text-sm font-semibold text-primary">Seluruh Cabang (Owner)</div>
                        ) : (
                          <div className="flex flex-wrap sm:justify-end gap-1">
                            {user.warehouse_accesses?.length > 0 ? (
                              user.warehouse_accesses.map((acc: any, i: number) => (
                                <span key={i} className="px-2 py-1 bg-muted text-foreground rounded text-xs font-medium border border-border">
                                  {acc.warehouse?.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-rose-500 font-medium italic">Tidak ada akses cabang</span>
                            )}
                          </div>
                        )}
                      </div>

                      {user.role?.name !== 'Owner' && (
                        <div className="flex items-center gap-1.5 ml-2 border-l pl-4 border-border/80">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(user)}
                            className="h-8 px-2.5 text-xs gap-1 font-semibold"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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
