"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowLeft, PlayCircle, StopCircle, Wallet, Clock, User, AlertCircle, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"
import { formatIDR } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PosShiftPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [currentShift, setCurrentShift] = useState<any>(null)
  const [warehouses, setWarehouses] = useState<any[]>([])

  const [openFormData, setOpenFormData] = useState({
    warehouseId: "",
    startingCash: ""
  })

  const [closeFormData, setCloseFormData] = useState({
    endingCash: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [shiftRes, whRes] = await Promise.all([
        api.get('/pos/shift'),
        api.get('/inventory/warehouses')
      ])
      
      setCurrentShift(shiftRes.data)
      setWarehouses(whRes.data)

      if (!shiftRes.data && whRes.data.length > 0) {
        const storedActive = localStorage.getItem("active_warehouse")
        if (storedActive) {
          const parsed = JSON.parse(storedActive)
          setOpenFormData(prev => ({ ...prev, warehouseId: parsed.id }))
        } else {
          setOpenFormData(prev => ({ ...prev, warehouseId: whRes.data[0].id }))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError("")
    
    if (!openFormData.warehouseId) {
      setError("Pilih gudang / lokasi toko terlebih dahulu")
      setProcessing(false)
      return
    }

    try {
      const payload = {
        warehouseId: openFormData.warehouseId,
        startingCash: Number(openFormData.startingCash.replace(/[^0-9.-]+/g,"")) || 0
      }
      await api.post('/pos/shift/open', payload)
      setSuccess("Shift berhasil dibuka!")
      
      // Auto redirect to pos after 1.5s
      setTimeout(() => {
        router.push('/pos/new-transaction')
      }, 1500)
      
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal membuka shift")
    } finally {
      setProcessing(false)
    }
  }

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError("")
    
    try {
      const payload = {
        endingCash: Number(closeFormData.endingCash.replace(/[^0-9.-]+/g,"")) || 0
      }
      await api.post('/pos/shift/close', payload)
      setSuccess("Shift berhasil ditutup!")
      setTimeout(() => {
        setSuccess("")
      }, 3000)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menutup shift")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Memuat data shift...</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/pos">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Shift & Kasir</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kelola pembukaan dan penutupan shift kasir harian.</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-lg flex items-center gap-3 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-4 rounded-lg flex items-center gap-3 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {currentShift ? (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-amber-500 transition-colors">
          <div className="h-2 w-full bg-amber-500"></div>
          <form onSubmit={handleCloseShift}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <StopCircle className="w-5 h-5 text-amber-500" /> Tutup Shift Kasir
                  </CardTitle>
                  <CardDescription className="mt-1.5">Anda saat ini memiliki shift yang sedang aktif.</CardDescription>
                </div>
                <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Aktif
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Waktu Mulai</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {new Date(currentShift.start_time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Modal Awal</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {formatIDR(currentShift.starting_cash)}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label htmlFor="endingCash" className="text-base font-semibold">Kas Aktual di Laci (Saat Ini)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 font-medium">Rp</div>
                  <Input 
                    id="endingCash"
                    type="text"
                    required
                    placeholder="Hitung jumlah fisik uang di laci..."
                    value={closeFormData.endingCash}
                    onChange={(e) => setCloseFormData({endingCash: e.target.value})}
                    className="pl-12 h-14 text-xl font-bold bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus-visible:ring-amber-500"
                  />
                </div>
                <p className="text-xs text-slate-500">Masukkan total fisik uang tunai yang ada di laci kasir sekarang untuk dicocokkan dengan sistem.</p>
              </div>

              <Button type="submit" disabled={processing} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-sm shadow-amber-500/20">
                {processing ? "Memproses..." : "Tutup Shift Sekarang"}
              </Button>
            </CardContent>
          </form>
        </Card>
      ) : (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-emerald-500 transition-colors">
          <div className="h-2 w-full bg-emerald-500"></div>
          <form onSubmit={handleOpenShift}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-emerald-500" /> Buka Shift Kasir Baru
                  </CardTitle>
                  <CardDescription className="mt-1.5">Mulai shift Anda dengan menentukan lokasi dan modal kas.</CardDescription>
                </div>
                <div className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Tutup
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <Label className="font-semibold">Lokasi Toko / Gudang</Label>
                <Select value={openFormData.warehouseId} onValueChange={(val) => setOpenFormData({...openFormData, warehouseId: val as string})}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-12">
                    <SelectValue placeholder="Pilih Lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label htmlFor="startingCash" className="text-base font-semibold">Modal Awal / Uang Kembalian di Laci</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 font-medium">Rp</div>
                  <Input 
                    id="startingCash"
                    type="text"
                    required
                    placeholder="Misal: 500000"
                    value={openFormData.startingCash}
                    onChange={(e) => setOpenFormData({...openFormData, startingCash: e.target.value})}
                    className="pl-12 h-14 text-xl font-bold bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 focus-visible:ring-emerald-500"
                  />
                </div>
                <p className="text-xs text-slate-500">Jumlah uang tunai fisik yang ada di laci saat shift ini dimulai.</p>
              </div>

              <Button type="submit" disabled={processing} className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg shadow-sm shadow-emerald-500/20">
                {processing ? "Memproses..." : "Mulai Shift & Buka Kasir"}
              </Button>
            </CardContent>
          </form>
        </Card>
      )}
    </div>
  )
}
