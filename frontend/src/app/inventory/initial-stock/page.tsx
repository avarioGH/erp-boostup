"use client"
import { useState, useEffect } from "react"
import { InventoryAPI, api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Box, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react"

export default function InitialStockPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [currentStocks, setCurrentStocks] = useState<Record<string, number>>({})
  
  // Mode: 'SET_EXACT' (Reset ke hitungan fisik nyata di gudang) atau 'INCREMENT' (Menambah stok masuk)
  const [mode, setMode] = useState<'SET_EXACT' | 'INCREMENT'>('SET_EXACT')

  const [form, setForm] = useState({
    warehouse_id: "",
    tally_date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    notes: "Penyesuaian Fisik Stok Gudang (Stock Opname)"
  })

  // Store quantities as an object mapped by product id
  const [quantities, setQuantities] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([
      InventoryAPI.getWarehouses().catch(() => []),
      InventoryAPI.getProducts().catch(() => [])
    ]).then(([wh, prod]) => {
      const whData = wh?.data || wh || []
      const prodData = prod?.data || prod || []
      setWarehouses(whData)
      setProducts(prodData)
      
      if (whData.length > 0) {
        setForm(prev => ({ ...prev, warehouse_id: whData[0].id }))
      }
    }).finally(() => {
      setFetching(false)
    })
  }, [])

  // Whenever warehouse or products change, extract existing stocks for this warehouse
  useEffect(() => {
    if (!form.warehouse_id || products.length === 0) return
    const stocksMap: Record<string, number> = {}
    products.forEach((p: any) => {
      const ws = p.warehouse_stocks?.find((w: any) => w.warehouse_id === form.warehouse_id)
      stocksMap[p.id] = ws ? ws.current_stock : 0
    })
    setCurrentStocks(stocksMap)
  }, [form.warehouse_id, products])

  const handleQtyChange = (productId: string, value: string) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: value
    }))
  }

  const setAllToCurrent = () => {
    const prefill: Record<string, string> = {}
    products.forEach(p => {
      const cur = currentStocks[p.id] || 0
      prefill[p.id] = cur < 0 ? "0" : String(cur)
    })
    setQuantities(prefill)
  }

  const resetAllMinusToZero = () => {
    const prefill = { ...quantities }
    products.forEach(p => {
      const cur = currentStocks[p.id] || 0
      if (cur < 0) {
        prefill[p.id] = "0"
      }
    })
    setQuantities(prefill)
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!form.warehouse_id) return toast({ title: "Pilih Gudang", variant: "destructive" })
    
    // Filter out items that have inputs
    const itemsToSubmit = products
      .filter(p => quantities[p.id] !== undefined && quantities[p.id] !== "" && !isNaN(Number(quantities[p.id])) && Number(quantities[p.id]) >= 0)
      .map(p => ({ product_id: p.id, qty: Number(quantities[p.id]) }))
      
    if (itemsToSubmit.length === 0) {
      return toast({ title: "Masukkan jumlah stok fisik setidaknya pada 1 produk", variant: "destructive" })
    }
    
    setLoading(true)
    try {
      await InventoryAPI.createStockInTally({
        ...form,
        mode: mode,
        is_exact_stock: mode === 'SET_EXACT',
        items: itemsToSubmit,
        idempotency_key: "stock_opname_" + Date.now()
      })
      toast({ 
        title: mode === 'SET_EXACT' ? "Stok Berhasil Disesuaikan!" : "Stok Awal Berhasil Ditambahkan!",
        description: `Stok produk berhasil diperbarui sesuai kondisi fisik nyata.`
      })
      router.push("/inventory/products")
    } catch(err: any) {
      toast({ title: "Gagal mencatat", description: err?.response?.data?.message || err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const hasNegativeStock = Object.values(currentStocks).some(val => val < 0)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hitung & Sesuaikan Stok Fisik Gudang</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Sesuaikan stok di sistem dengan jumlah fisik nyata di storage / freezer agar tidak ada stok minus.
          </p>
        </div>
      </div>

      {hasNegativeStock && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-rose-900 dark:text-rose-200">
            <p className="font-bold">Terdeteksi Stok Bernilai Minus di Gudang ini!</p>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              Stok minus terjadi karena penjualan/pengeluaran tercatat sebelum stok masuk diinput. Anda dapat mengisi jumlah fisik riil di bawah untuk langsung mengembalikan stok menjadi akurat.
            </p>
            <div className="mt-2.5">
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={resetAllMinusToZero}
                className="bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 text-xs font-semibold"
              >
                Set Semua Produk Minus Menjadi 0
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-lg">Pengaturan Lokasi & Metode Penyesuaian</CardTitle>
            <CardDescription>Pilih gudang yang sedang dihitung dan metode update stok.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Lokasi Gudang / Cabang</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.warehouse_id}
                onChange={e => setForm({...form, warehouse_id: e.target.value})}
                required
              >
                <option value="">Pilih Gudang...</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Mode Perhitungan</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                value={mode}
                onChange={e => setMode(e.target.value as any)}
              >
                <option value="SET_EXACT">Sesuaikan Persis Hasil Hitung Fisik (Rekomendasi)</option>
                <option value="INCREMENT">Tambahkan ke Stok yang Sudah Ada (+)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">Tanggal Perhitungan</Label>
              <Input type="date" value={form.tally_date} onChange={e => setForm({...form, tally_date: e.target.value})} required className="bg-card" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Daftar Produk & Stok Fisik Nyata</CardTitle>
              <CardDescription>
                {mode === 'SET_EXACT' 
                  ? 'Masukkan jumlah unit ikan yang benar-benar ada di storage fisik saat ini.'
                  : 'Masukkan jumlah unit tambahan yang ingin dimasukkan ke stok.'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={setAllToCurrent}
                className="text-xs gap-1 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Salin Stok Sistem Saat Ini
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetching ? (
              <div className="p-12 text-center text-muted-foreground">Memuat data produk...</div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-lg m-4">
                <Box className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">Belum ada Produk Ikan terdaftar.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/inventory/products')}>Buat Produk Dulu</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase">Kode SKU</th>
                      <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase">Nama Produk</th>
                      <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase">Kategori</th>
                      <th className="px-4 py-3 text-right font-semibold text-xs text-muted-foreground uppercase">Stok Sistem Saat Ini</th>
                      <th className="px-4 py-3 text-right font-semibold text-xs text-primary uppercase w-48">
                        {mode === 'SET_EXACT' ? 'Stok Fisik Sebenarnya' : 'Tambah Qty'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map(p => {
                      const cur = currentStocks[p.id] !== undefined ? currentStocks[p.id] : 0
                      const isNegative = cur < 0
                      const entered = quantities[p.id]
                      const diff = entered !== undefined && entered !== "" ? Number(entered) - cur : null

                      return (
                        <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${isNegative ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.code || '-'}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{p.category?.name || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold font-mono text-xs px-2 py-0.5 rounded ${
                              isNegative ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 'text-muted-foreground'
                            }`}>
                              {cur} unit
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Input 
                                type="number" 
                                min="0"
                                placeholder={isNegative ? "0" : String(cur)}
                                className={`w-28 text-right font-bold font-mono ${
                                  entered !== undefined && entered !== "" 
                                    ? 'border-primary ring-1 ring-primary/30' 
                                    : isNegative ? 'border-rose-400 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/30' : ''
                                }`}
                                value={quantities[p.id] ?? ""}
                                onChange={(e) => handleQtyChange(p.id, e.target.value)}
                              />
                            </div>
                            {mode === 'SET_EXACT' && diff !== null && diff !== 0 && (
                              <span className={`text-[10px] block mt-0.5 font-mono ${diff > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {diff > 0 ? `+${diff}` : diff} selisih
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Stok yang disimpan akan langsung ter-update di Katalog Produk, POS Kasir, dan Laporan.
          </p>
          <Button type="submit" disabled={loading || products.length === 0} className="w-full sm:w-auto shadow-md font-semibold gap-2" size="lg">
            {loading ? "Menyimpan Penyesuaian..." : <><Save className="w-4 h-4" /> Simpan Penyesuaian Stok</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
