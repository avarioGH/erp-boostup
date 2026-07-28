"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Minus, AlertCircle, CheckCircle2 } from "lucide-react"
import { api, FinanceAPI } from "@/lib/api"
import Link from "next/link"

export default function FinanceCashOut() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await FinanceAPI.getCategories()
        setCategories(data.filter((c: any) => c.type === "EXPENSE"))
      } catch (err) {
        console.error("Failed to load categories:", err)
      }
    }
    loadCategories()
  }, [])

  const [formData, setFormData] = useState({
    amount: "",
    categoryId: "", 
    description: "",
    date: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const payload = {
        amount: Number(formData.amount.replace(/[^0-9.-]+/g,"")),
        categoryId: formData.categoryId,
        description: formData.description,
        transactionDate: formData.date
      }
      await api.post('/finance/cash-out', payload)
      setSuccess(true)
      setTimeout(() => {
        router.push('/finance')
      }, 2000)
    } catch (err) {
      console.error(err)
      setError("Gagal menyimpan transaksi. Pastikan server terhubung.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Catat Pengeluaran</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Keluarkan dana untuk operasional perusahaan.</p>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-2 w-full bg-rose-500"></div>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Minus className="w-5 h-5 text-rose-500" /> Detail Pengeluaran
            </CardTitle>
            <CardDescription>Masukkan nominal dan keterangan biaya dengan tepat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-medium text-sm">Pengeluaran berhasil dicatat! Mengalihkan...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-4 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-700 dark:text-slate-300">Nominal Pengeluaran (Rp)</Label>
              <Input 
                id="amount" 
                type="number"
                placeholder="Misal: 500000" 
                className="text-lg font-medium"
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-700 dark:text-slate-300">Tanggal Transaksi</Label>
                <Input 
                  id="date" 
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-700 dark:text-slate-300">Kategori Biaya</Label>
                <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val || ""})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c, idx) => (
                      <SelectItem key={c?.id || idx} value={c?.id || `cat-${idx}`}>{c?.name}</SelectItem>
                    ))}
                    {categories.length === 0 && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc" className="text-slate-700 dark:text-slate-300">Keterangan Tambahan</Label>
              <Input 
                id="desc" 
                placeholder="Misal: Pembayaran listrik bulan Juli" 
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={() => router.push('/finance')} disabled={loading || success}>Batal</Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white gap-2" disabled={loading || success}>
              {loading ? "Menyimpan..." : <><Save className="w-4 h-4" /> Simpan Pengeluaran</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
