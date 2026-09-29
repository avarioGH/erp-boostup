"use client"
import { useState, useEffect } from "react"
import { InventoryAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Plus, X, ArrowLeft } from "lucide-react"

export default function CreateInflowPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  const [form, setForm] = useState({
    warehouse_id: "",
    tally_date: new Date().toISOString().split('T')[0],
    notes: ""
  })

  const [items, setItems] = useState([
    { product_id: "", qty: 1 }
  ])

  useEffect(() => {
    Promise.all([
      InventoryAPI.getWarehouses().catch(() => []),
      InventoryAPI.getProducts().catch(() => [])
    ]).then(([wh, prod]) => {
      setWarehouses(wh?.data || wh || [])
      setProducts(prod?.data || prod || [])
    })
  }, [])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!form.warehouse_id) return toast({ title: "Pilih Gudang Penerima", variant: "destructive" })
    if (items.length === 0) return toast({ title: "Tambah minimal 1 barang", variant: "destructive" })
    
    setLoading(true)
    try {
      await InventoryAPI.createStockInTally({
        ...form,
        items
      })
      toast({ title: "Berhasil mencatat ikan masuk" })
      router.push("/inventory/inflow")
    } catch(err) {
      toast({ title: "Gagal mencatat", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/inventory/inflow")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Catat Ikan Masuk (Teli)</h1>
          <p className="text-muted-foreground text-sm">Input data penerimaan stok ikan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Informasi Penerimaan</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Masuk</Label>
              <Input type="date" value={form.tally_date} onChange={e => setForm({...form, tally_date: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Gudang Tujuan</Label>
              <Select value={form.warehouse_id} onValueChange={(v: any) => setForm({...form, warehouse_id: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih Gudang" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Keterangan Tambahan</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Contoh: Dari Kapal A, atau Nelayan B" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle>Rincian Ikan</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { product_id: "", qty: 1 }])}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Baris
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-end border-b pb-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Jenis Ikan</Label>
                  <Select value={item.product_id} onValueChange={(v: any) => {
                    const newItems = [...items]; 
                    newItems[index].product_id = v;
                    setItems(newItems);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Pilih Ikan..." /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} {p.weight ? `(${p.weight}g)` : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32 space-y-2">
                  <Label className="text-xs">Jumlah</Label>
                  <Input type="number" min="1" value={item.qty} onChange={e => {
                    const newItems = [...items]; newItems[index].qty = e.target.value as any; setItems(newItems);
                  }} />
                </div>
                <div className="pb-1">
                  <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => setItems(items.filter((_, i) => i !== index))}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Belum ada barang ditambahkan.</p>}
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Menyimpan..." : "Simpan Data Ikan Masuk"}
        </Button>
      </form>
    </div>
  )
}
