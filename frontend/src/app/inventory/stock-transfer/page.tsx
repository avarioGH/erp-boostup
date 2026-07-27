"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, ArrowRightLeft, AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"

export default function StockTransferPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [warehouseStocks, setWarehouseStocks] = useState<any[]>([])

  const [formData, setFormData] = useState({
    sourceWarehouseId: "",
    targetWarehouseId: "",
    notes: "",
    items: [
      { productId: "", qty: 1, unitCost: 0, notes: "" }
    ]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [whRes, prdRes, stockRes] = await Promise.all([
        api.get('/inventory/warehouses'),
        api.get('/inventory/products'),
        api.get('/inventory/stocks')
      ])
      setWarehouses(whRes.data)
      setProducts(prdRes.data)
      setWarehouseStocks(stockRes.data)
      
      // Auto select first warehouse if available
      if (whRes.data.length > 0) {
        const storedActive = localStorage.getItem("active_warehouse")
        if (storedActive) {
          const parsed = JSON.parse(storedActive)
          setFormData(prev => ({ ...prev, sourceWarehouseId: parsed.id }))
        } else {
          setFormData(prev => ({ ...prev, sourceWarehouseId: whRes.data[0].id }))
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data referensi", err)
    }
  }

  const getAvailableStock = (productId: string) => {
    if (!formData.sourceWarehouseId || !productId) return 0
    const stock = warehouseStocks.find(s => s.warehouse_id === formData.sourceWarehouseId && s.product_id === productId)
    return stock ? stock.available_stock : 0
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: "", qty: 1, unitCost: 0, notes: "" }]
    }))
  }

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems.splice(index, 1)
      return { ...prev, items: newItems }
    })
  }

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      
      // Auto fill unit cost if product is selected
      if (field === 'productId') {
        const product = products.find(p => p.id === value)
        if (product && product.purchase_price) {
          newItems[index].unitCost = Number(product.purchase_price)
        }
      }
      
      return { ...prev, items: newItems }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    // Validate
    if (!formData.sourceWarehouseId) {
      setError("Pilih gudang asal")
      setLoading(false)
      return
    }
    if (!formData.targetWarehouseId) {
      setError("Pilih gudang tujuan")
      setLoading(false)
      return
    }
    if (formData.sourceWarehouseId === formData.targetWarehouseId) {
      setError("Gudang asal dan tujuan tidak boleh sama")
      setLoading(false)
      return
    }
    
    const invalidItems = formData.items.filter(i => !i.productId || i.qty <= 0)
    if (invalidItems.length > 0) {
      setError("Pastikan semua item memiliki produk dan kuantitas lebih dari 0")
      setLoading(false)
      return
    }

    // Validate Stock
    for (const item of formData.items) {
      const available = getAvailableStock(item.productId)
      if (item.qty > available) {
        const prod = products.find(p => p.id === item.productId)
        setError(`Stok tidak mencukupi untuk produk ${prod?.name}. Tersedia: ${available}`)
        setLoading(false)
        return
      }
    }

    try {
      await api.post('/inventory/transfer', formData)
      setSuccess(true)
      setTimeout(() => {
        router.push('/inventory')
      }, 2000)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || "Gagal menyimpan transaksi transfer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Transfer Gudang</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pindahkan stok barang antar gudang cabang Anda.</p>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-indigo-500 transition-colors">
        <div className="h-2 w-full bg-indigo-500"></div>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-500" /> Detail Transfer
            </CardTitle>
            <CardDescription>Pilih gudang asal, gudang tujuan, dan rincian barang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-lg flex items-center gap-3 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium text-sm">Transaksi transfer berhasil disimpan! Mengalihkan...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-4 rounded-lg flex items-center gap-3 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="space-y-2">
                <Label>Gudang Asal</Label>
                <Select value={formData.sourceWarehouseId} onValueChange={(val) => setFormData({...formData, sourceWarehouseId: val as string})}>
                  <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800">
                    <SelectValue placeholder="Pilih Gudang Asal" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-3 items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full p-2 border border-slate-200 dark:border-slate-700 z-10">
                <ArrowRightLeft className="w-4 h-4 text-slate-500" />
              </div>

              <div className="space-y-2">
                <Label>Gudang Tujuan</Label>
                <Select value={formData.targetWarehouseId} onValueChange={(val) => setFormData({...formData, targetWarehouseId: val as string})}>
                  <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800">
                    <SelectValue placeholder="Pilih Gudang Tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.filter(w => w.id !== formData.sourceWarehouseId).map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Input 
                placeholder="Misal: Mutasi stok berlebih ke cabang" 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Daftar Barang yang Ditransfer</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                  <Plus className="w-4 h-4" /> Tambah Baris
                </Button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800 relative">
                    {formData.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="absolute -top-2 -right-2 bg-white dark:bg-slate-950 text-rose-500 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-sm z-10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    <div className="space-y-2 flex-1 w-full">
                      <Label className="text-xs">Produk</Label>
                      <Select value={item.productId} onValueChange={(val) => updateItem(index, 'productId', val as string)}>
                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800">
                          <SelectValue placeholder="Pilih Produk" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(p => {
                            const avail = getAvailableStock(p.id)
                            return (
                              <SelectItem key={p.id} value={p.id} disabled={avail <= 0}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{p.name}</span>
                                  <span className="text-xs text-slate-400 ml-2">(Stok Asal: {avail})</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 w-full sm:w-24">
                      <Label className="text-xs">Kuantitas</Label>
                      <Input 
                        type="number" min="1" max={getAvailableStock(item.productId)}
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', Number(e.target.value))}
                        className={`bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 ${item.qty > getAvailableStock(item.productId) ? 'border-rose-500 text-rose-500' : ''}`}
                      />
                    </div>

                    <div className="space-y-2 w-full sm:w-32">
                      <Label className="text-xs">Harga Cost (Rp)</Label>
                      <Input 
                        type="number" min="0" disabled
                        value={item.unitCost}
                        onChange={(e) => updateItem(index, 'unitCost', Number(e.target.value))}
                        className="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <Link href="/inventory">
                <Button type="button" variant="outline">Batal</Button>
              </Link>
              <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]">
                {loading ? "Memproses..." : (
                  <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Proses Transfer</span>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
