"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { 
  Building2, Users, Save, Plus, Shield, UserPlus, 
  Trash2, AlertCircle, Key, CheckCircle2, LayoutDashboard,
  Server, HardDrive, Bot, Calendar, ArrowLeft, RefreshCw, Trees, Fish,
  DollarSign, CreditCard, Activity, CheckCircle, Clock, ExternalLink,
  Edit, Edit3, X
} from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"

export default function AdminSaaSDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  // Edit State
  const [editModal, setEditModal] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    company_name: "",
    email: "",
    phone: "",
    address: "",
    status: "ACTIVE",
    duration_months: 0,
  })

  // Delete State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    type: "FISH",
    company_name: "",
    owner_username: "",
    owner_name: "",
    owner_email: "",
    owner_password: "",
    plan_name: "Pro Business",
    price_monthly: 2500000,
    duration_months: 12,
    phone: "",
    address: ""
  })

  useEffect(() => {
    // 1. Instant load from local storage cache (0ms)
    try {
      const cached = localStorage.getItem('saas_clients_cache');
      if (cached) {
        setClients(JSON.parse(cached));
        setLoading(false);
      }
    } catch (e) {}

    // 2. Fetch fresh data in background (Stale-While-Revalidate)
    fetchClients();
  }, [])

  const fetchClients = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/platform/clients');
      const data = res.data || [];
      setClients(data);
      try {
        localStorage.setItem('saas_clients_cache', JSON.stringify(data));
      } catch (e) {}
    } catch (err: any) {
      console.error(err);
      if (clients.length === 0) {
        setError(err.response?.data?.message || "Gagal memuat database klien SaaS");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      await api.post('/platform/clients', formData)
      setSuccess(`Klien ${formData.company_name} berhasil didaftarkan!`)
      setShowModal(false)
      fetchClients()
      setFormData({
        type: "FISH",
        company_name: "",
        owner_username: "",
        owner_name: "",
        owner_email: "",
        owner_password: "",
        plan_name: "Pro Business",
        price_monthly: 2500000,
        duration_months: 12,
        phone: "",
        address: ""
      })
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mendaftarkan klien baru")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (client: any) => {
    setEditingClient(client)
    setEditFormData({
      company_name: client.company_name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      status: client.status || "ACTIVE",
      duration_months: 0,
    })
    setEditModal(true)
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return
    setSubmitting(true)
    setError("")

    try {
      await api.put(`/platform/clients/${editingClient.company_id}`, editFormData)
      setSuccess(`Data klien ${editFormData.company_name} berhasil diperbarui!`)
      setEditModal(false)
      setEditingClient(null)
      fetchClients()
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memperbarui klien")
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = (client: any) => {
    setClientToDelete(client)
    setDeleteConfirmModal(true)
  }

  const handleDeleteClient = async () => {
    if (!clientToDelete) return
    setDeleting(true)
    setError("")

    try {
      const res = await api.delete(`/platform/clients/${clientToDelete.company_id}`)
      setSuccess(res.data?.message || `Klien ${clientToDelete.company_name} berhasil dihapus!`)
      setDeleteConfirmModal(false)
      setClientToDelete(null)
      fetchClients()
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menghapus klien")
    } finally {
      setDeleting(false)
    }
  }

  // Ringkasan Keuangan SaaS
  const totalRevenueMonthly = clients.reduce((acc, c) => acc + (Number(c.subscription?.price_monthly) || 0), 0)
  const activeTenants = clients.filter(c => c.company_name !== 'SYSTEM INTERNAL')

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-16 pt-4 px-4 sm:px-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Tatalora SaaS Super Admin
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                adminku.tatalora.com
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Portal kendali database klien, langganan bulanan, storage quota, dan token AI untuk industri Kayu & Ikan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchClients} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setShowModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm">
            <Plus className="w-4 h-4" /> Daftarkan Klien Baru
          </Button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex items-center gap-3 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {/* Grid KPI Super Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold">
              <span>TOTAL CLIENTS ACTIVE</span>
              <Building2 className="w-4 h-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-foreground">{activeTenants.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="text-amber-600 font-semibold">{clients.filter(c => c.type === 'WOOD').length} Wood</span>
              <span>•</span>
              <span className="text-cyan-600 font-semibold">{clients.filter(c => c.type === 'FISH' && c.company_name !== 'SYSTEM INTERNAL').length} Fish</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold">
              <span>ESTIMATED MRR (MONTHLY)</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-emerald-600">
              Rp {(totalRevenueMonthly / 1000000).toFixed(1)} jt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Total tagihan langganan bulanan klien</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold">
              <span>TOTAL STORAGE USED</span>
              <HardDrive className="w-4 h-4 text-blue-600" />
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-foreground">
              {clients.reduce((acc, c) => acc + (Number(c.usage?.storage_used_mb) || 0), 0).toFixed(1)} MB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Dari kuota PostgreSQL Supabase Pro</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold">
              <span>AI INFERENCE QUERIES</span>
              <Bot className="w-4 h-4 text-purple-600" />
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-foreground">
              {clients.reduce((acc, c) => acc + (Number(c.usage?.ai_queries_used) || 0), 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Akumulasi request analisis AI</div>
          </CardContent>
        </Card>
      </div>

      {/* Form Pendaftaran Klien Baru */}
      {showModal && (
        <Card className="border-t-4 border-t-primary shadow-xl">
          <form onSubmit={handleCreateClient}>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-xl flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> Daftarkan Klien / Tenant Baru
              </CardTitle>
              <CardDescription>
                Membuat partisi database klien terisolasi, akun login Owner, paket langganan bulanan, dan gudang awal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kolom 1: Profil Bisnis */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" /> 1. Data Perusahaan Klien
                  </h3>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">PILIH VERTIKAL INDUSTRI</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setFormData({...formData, type: 'WOOD'})}
                        className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                          formData.type === 'WOOD' 
                            ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Trees className="w-6 h-6 text-amber-600 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-sm">Industri Kayu</p>
                          <p className="text-xs text-muted-foreground">wood.tatalora.com</p>
                        </div>
                      </div>

                      <div 
                        onClick={() => setFormData({...formData, type: 'FISH'})}
                        className={`cursor-pointer p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                          formData.type === 'FISH' 
                            ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/30' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <Fish className="w-6 h-6 text-cyan-600 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-sm">Industri Ikan</p>
                          <p className="text-xs text-muted-foreground">fish.tatalora.com</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">NAMA PERUSAHAAN / PT <span className="text-rose-500">*</span></Label>
                    <Input 
                      required 
                      placeholder="Contoh: PT Samudra Bahari Makmur"
                      value={formData.company_name}
                      onChange={e => setFormData({...formData, company_name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">NOMOR KONTAK / WHATSAPP</Label>
                    <Input 
                      placeholder="0812xxxxxxxx"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold">ALAMAT / PELABUHAN / COLD STORAGE</Label>
                    <Input 
                      placeholder="Contoh: Muara Baru Blok A, Jakarta Utara"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                </div>

                {/* Kolom 2: Akun Owner & Billing */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" /> 2. Akun Owner & Biaya Langganan
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">USERNAME OWNER <span className="text-rose-500">*</span></Label>
                      <Input 
                        required 
                        placeholder="owner_samudra"
                        value={formData.owner_username}
                        onChange={e => setFormData({...formData, owner_username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">NAMA LENGKAP OWNER</Label>
                      <Input 
                        placeholder="Bpk. Hendra Gunawan"
                        value={formData.owner_name}
                        onChange={e => setFormData({...formData, owner_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">EMAIL OWNER</Label>
                      <Input 
                        type="email"
                        placeholder="hendra@samudrabahari.com"
                        value={formData.owner_email}
                        onChange={e => setFormData({...formData, owner_email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">PASSWORD LOGIN <span className="text-rose-500">*</span></Label>
                      <Input 
                        required
                        type="password"
                        placeholder="••••••••"
                        value={formData.owner_password}
                        onChange={e => setFormData({...formData, owner_password: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">BIAYA BULANAN (IDR / BULAN)</Label>
                      <Input 
                        type="number"
                        step="100000"
                        value={formData.price_monthly}
                        onChange={e => setFormData({...formData, price_monthly: Number(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold">DURASI KONTRAK AWAL</Label>
                      <select 
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium"
                        value={formData.duration_months}
                        onChange={e => setFormData({...formData, duration_months: Number(e.target.value)})}
                      >
                        <option value={1}>1 Bulan</option>
                        <option value={3}>3 Bulan</option>
                        <option value={6}>6 Bulan</option>
                        <option value={12}>12 Bulan (1 Tahun)</option>
                        <option value={24}>24 Bulan (2 Tahun)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
                <Button type="submit" disabled={submitting} className="min-w-[170px] gap-2 bg-primary font-bold">
                  {submitting ? "Membuat Akun..." : <><Save className="w-4 h-4" /> Simpan & Beri Akses</>}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      {/* Tabel Database Klien SaaS */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" /> Database Klien & Monitoring SaaS
          </CardTitle>
          <CardDescription>
            Semua data transaksi dan gudang terisolasi penuh per ID Perusahaan (Company ID).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <p>Memuat database klien SaaS...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">Belum ada klien SaaS terdaftar.</div>
          ) : (
            <div className="divide-y divide-border">
              {clients.map(client => {
                const isInternal = client.company_name === 'SYSTEM INTERNAL'
                if (isInternal) return null

                const priceMonthly = Number(client.subscription?.price_monthly) || 2500000
                const isExpired = client.subscription?.is_expired

                return (
                  <div key={client.company_id} className="p-5 hover:bg-muted/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Profil Klien & Owner */}
                    <div className="space-y-2 max-w-md">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                          client.type === 'WOOD' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' 
                            : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'
                        }`}>
                          {client.type === 'WOOD' ? 'Wood ERP' : 'Fish ERP'}
                        </span>

                        <span className="font-extrabold text-base text-foreground">{client.company_name}</span>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          !isExpired
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}>
                          {!isExpired ? 'ACTIVE' : 'EXPIRED'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground">
                        <span className="font-mono bg-muted px-2 py-0.5 rounded border">
                          Owner: @{client.owners?.[0]?.username || '-'} ({client.owners?.[0]?.name || '-'})
                        </span>
                        <span>•</span>
                        <span>{client.usage?.total_warehouses || 0} Gudang</span>
                        <span>•</span>
                        <span>{client.usage?.total_users || 0} Pengguna</span>
                        <span>•</span>
                        <a 
                          href={client.type === 'WOOD' ? 'http://wood.tatalora.com' : 'http://fish.tatalora.com'} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-primary hover:underline font-mono flex items-center gap-1"
                        >
                          {client.type === 'WOOD' ? 'wood.tatalora.com' : 'fish.tatalora.com'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Ringkasan Biaya, Masa Aktif & Storage */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {/* Biaya Monthly */}
                      <div className="bg-muted/40 p-3 rounded-xl border">
                        <div className="text-muted-foreground flex items-center gap-1 mb-1 font-semibold">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Biaya Langganan
                        </div>
                        <div className="font-extrabold text-foreground text-sm text-emerald-600">
                          Rp {priceMonthly.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">/ bulan ({client.subscription?.billing_cycle || 'MONTHLY'})</div>
                      </div>

                      {/* Masa Aktif */}
                      <div className="bg-muted/40 p-3 rounded-xl border">
                        <div className="text-muted-foreground flex items-center gap-1 mb-1 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" /> Masa Aktif
                        </div>
                        <div className="font-bold text-foreground">
                          {client.subscription?.end_date ? new Date(client.subscription.end_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Lifetime'}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{client.subscription?.plan_name || 'Pro Business'}</div>
                      </div>

                      {/* Storage Quota */}
                      <div className="bg-muted/40 p-3 rounded-xl border">
                        <div className="text-muted-foreground flex items-center gap-1 mb-1 font-semibold">
                          <HardDrive className="w-3.5 h-3.5 text-amber-600" /> Pemakaian Storage
                        </div>
                        <div className="font-bold text-foreground">
                          {client.usage?.storage_used_mb || 0} MB
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Batas: {client.usage?.storage_limit_mb || 5120} MB</div>
                      </div>

                      {/* Kuota AI */}
                      <div className="bg-muted/40 p-3 rounded-xl border">
                        <div className="text-muted-foreground flex items-center gap-1 mb-1 font-semibold">
                          <Bot className="w-3.5 h-3.5 text-purple-600" /> AI Queries
                        </div>
                        <div className="font-bold text-foreground">
                          {client.usage?.ai_queries_used || 0} queries
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">AI Engine Token</div>
                      </div>
                    </div>

                    {/* Aksi Edit & Hapus Klien */}
                    <div className="flex items-center gap-2 lg:flex-col justify-end pt-2 lg:pt-0 border-t lg:border-t-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(client)}
                        className="gap-1.5 text-xs font-semibold hover:bg-primary/10 hover:text-primary w-full sm:w-auto"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleConfirmDelete(client)}
                        className="gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 w-full sm:w-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Edit Klien SaaS */}
      {editModal && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border bg-card">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-primary" /> Edit Klien SaaS
                  </CardTitle>
                  <CardDescription>
                    Perbarui profil perusahaan, kontak, status aktif, dan perpanjangan masa langganan.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setEditModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <form onSubmit={handleUpdateClient}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Nama Perusahaan / Bisnis</Label>
                  <Input
                    required
                    value={editFormData.company_name}
                    onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Email Perusahaan / Billing</Label>
                    <Input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>No. WhatsApp / Telepon</Label>
                    <Input
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Alamat Operasional</Label>
                  <Input
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-1.5">
                    <Label>Status Tenant</Label>
                    <select
                      className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    >
                      <option value="ACTIVE">Aktif (ACTIVE)</option>
                      <option value="SUSPENDED">Nonaktif / Ditangguhkan (SUSPENDED)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Perpanjang Masa Aktif (+Bulan)</Label>
                    <select
                      className="w-full h-10 px-3 rounded-lg border bg-background text-sm"
                      value={editFormData.duration_months}
                      onChange={(e) => setEditFormData({ ...editFormData, duration_months: Number(e.target.value) })}
                    >
                      <option value="0">Tetap (Tidak Ada Perpanjangan)</option>
                      <option value="1">+1 Bulan</option>
                      <option value="3">+3 Bulan</option>
                      <option value="6">+6 Bulan</option>
                      <option value="12">+12 Bulan (1 Tahun)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setEditModal(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting} className="font-bold gap-2">
                    {submitting ? "Menyimpan..." : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Klien SaaS */}
      {deleteConfirmModal && clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border bg-card">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/60">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">Hapus Klien SaaS?</CardTitle>
                  <CardDescription className="text-xs">Tindakan ini memerlukan konfirmasi.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-foreground">
                Apakah Anda yakin ingin menghapus data klien <strong>{clientToDelete.company_name}</strong>?
              </p>
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                ⚠️ Jika perusahaan ini sudah memiliki riwayat transaksi/faktur/jurnal keuangan yang saling berkait, sistem otomatis mengubah status tenant menjadi <strong>Nonaktif (SUSPENDED)</strong> untuk melindungi integritas pembukuan.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmModal(false)}
                  disabled={deleting}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClient}
                  disabled={deleting}
                  className="gap-2 font-bold bg-rose-600 hover:bg-rose-700"
                >
                  {deleting ? "Menghapus..." : <><Trash2 className="w-4 h-4" /> Ya, Hapus Klien</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
