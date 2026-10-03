"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { InventoryAPI, InventoryDisposalAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function CreateDisposalPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [stocks, setStocks] = useState<any[]>([])

  const [form, setForm] = useState({
    disposalDate: new Date().toISOString().split("T")[0],
    warehouseId: "",
    notes: "",
  })

  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    InventoryAPI.getWarehouses().then((res: any) => setWarehouses(Array.isArray(res) ? res : res.data || []))
    // Could fetch products, but better to fetch stocks in warehouse to dispose
    InventoryAPI.getStocks().then((res: any) => setStocks(Array.isArray(res) ? res : res.data || []))
  }, [])

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, notes: "" }])
  }

  const removeItem = (index: number) => {
    setItems((Array.isArray(items) ? items : []).filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.warehouseId) return toast({ title: "Error", description: "Please select a warehouse.", variant: "destructive" })
    if (items.length === 0) return toast({ title: "Error", description: "Please add at least one item.", variant: "destructive" })

    setLoading(true)
    try {
      await InventoryDisposalAPI.createDisposal({
        ...form,
        items: items.map(it => ({
          ...it,
          quantity: Number(it.quantity)
        }))
      })
      toast({ title: "Success", description: "Disposal created successfully." })
      router.push("/inventory/disposals")
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to create disposal.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Filter stocks by warehouse
  const filteredStocks = stocks.filter(s => s.warehouseId === form.warehouseId || s.warehouse_id === form.warehouseId)
  
  // Extract unique products from stock
  const availableProducts = Array.from(new Map(filteredStocks.map(s => {
      const pId = s.productId || s.product_id;
      const product = s.product || { name: 'Unknown Product', sku: '' };
      return [pId, { id: pId, name: product.name, sku: product.sku }];
  })).values());

  return (
    <div className="space-y-6 pb-10 p-4 md:p-8 dark">
      <div className="flex items-center gap-4">
        <Link href="/inventory/disposals">
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Buat Pemusnahan Baru</h1>
          <p className="text-sm text-muted-foreground">Catat barang rusak atau expired</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-[#0f172a] text-white border-border">
          <CardHeader>
            <CardTitle className="text-lg">Detail Pemusnahan</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" className="bg-background text-foreground" value={form.disposalDate} onChange={(e) => setForm({...form, disposalDate: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Gudang</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={form.warehouseId} onChange={(e) => setForm({...form, warehouseId: e.target.value})} required>
                <option value="">Pilih Gudang...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Keterangan (Opsional)</Label>
              <Input placeholder="Alasan pemusnahan..." className="bg-background text-foreground" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f172a] text-white border-border overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Barang Dimusnahkan</CardTitle>
            <Button type="button" onClick={addItem} size="sm" className="gap-2" disabled={!form.warehouseId}><Plus className="w-4 h-4"/> Tambah Barang</Button>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded text-muted-foreground">Belum ada barang. Silakan pilih gudang lalu tambah barang.</div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border border-border/50 rounded-lg relative items-end bg-background/50">
                    <div className="md:col-span-5 space-y-1">
                      <Label className="text-xs">Produk</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)} required>
                        <option value="">Pilih Produk...</option>
                        {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku || p.id})</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" min="1" className="bg-background text-foreground" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required />
                    </div>
                    <div className="md:col-span-4 space-y-1">
                      <Label className="text-xs">Keterangan Item</Label>
                      <Input placeholder="e.g. Busuk" className="bg-background text-foreground" value={item.notes} onChange={(e) => updateItem(index, 'notes', e.target.value)} />
                    </div>
                    <div className="md:col-span-1 text-right">
                      <Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-500 hover:bg-red-500/10" onClick={() => removeItem(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/inventory/disposals">
            <Button type="button" variant="outline">Batal</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Pemusnahan"}
          </Button>
        </div>
      </form>
    </div>
  )
}
