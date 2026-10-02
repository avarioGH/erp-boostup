"use client"
import { useState, useEffect } from "react"
import { B2BApi, InventoryAPI, api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Plus, X, ArrowLeft } from "lucide-react"

export default function CreateSalesOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  const [form, setForm] = useState({
    customer_id: "",
    order_date: new Date().toISOString().split('T')[0],
    notes: "",
    payment_method: "Transfer"
  })

  const [items, setItems] = useState([
    { product_id: "", qty: 1, unit_price: 0 }
  ])

  const [paidAmount, setPaidAmount] = useState<number | "">("")

  useEffect(() => {
    Promise.all([
      api.get('/customers?limit=1000').then(res => res.data).catch(() => []), 
      InventoryAPI.getProducts().catch(() => [])
    ]).then(([cust, prod]) => {
      setCustomers(cust?.data || cust || [])
      setProducts(prod?.data || prod || [])
    })
  }, [])

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unit_price)), 0)
  const dibayar = Number(paidAmount) || 0
  const piutang = Math.max(0, totalAmount - dibayar)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!form.customer_id) return toast({ title: "Pilih Pelanggan", variant: "destructive" })
    if (items.length === 0) return toast({ title: "Tambah minimal 1 barang", variant: "destructive" })
    
    setLoading(true)
    try {
      await B2BApi.createOrder({
        ...form,
        items,
        total_amount: totalAmount,
        paidAmount: paidAmount === "" ? undefined : Number(paidAmount)
      })
      toast({ title: "Sales Order Berhasil dibuat" })
      router.push("/sales/orders")
    } catch(err) {
      toast({ title: "Gagal membuat Order", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/sales/orders")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Buat Sales Order (SO)</h1>
          <p className="text-muted-foreground text-sm">Pesanan Penjualan Langsung</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Data Utama</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pelanggan (Customer)</Label>
              <Select value={form.customer_id} onValueChange={(v: any) => setForm({...form, customer_id: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih Pelanggan" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id || c._id} value={c.id || c._id}>
                      {c.code ? `${c.code} - ` : ''}{c.name || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal Order</Label>
              <Input type="date" value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={form.payment_method} onValueChange={(v: any) => setForm({...form, payment_method: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih Metode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Cash">Cash / Tunai</SelectItem>
                  <SelectItem value="Tempo">Tempo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catatan Tambahan</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Catatan opsional..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle>Rincian Barang</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { product_id: "", qty: 1, unit_price: 0 }])}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Barang
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-4">
                <div className="col-span-5 space-y-2">
                  <Label className="text-xs">Barang</Label>
                  <Select value={item.product_id} onValueChange={(v: any) => {
                    const newItems = [...items]; 
                    newItems[index].product_id = v;
                    // Auto fill price if possible
                    const prod = products.find(p => p.id === v || p._id === v);
                    if (prod && prod.sell_price) newItems[index].unit_price = prod.sell_price;
                    setItems(newItems);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Pilih Produk..." /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id || p._id} value={p.id || p._id}>
                          {p.code ? `[${p.code}] ` : ''}{p.name || 'Unknown Product'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" step="any" min="0" value={item.qty} onChange={e => {
                    const newItems = [...items]; newItems[index].qty = e.target.value as any; setItems(newItems);
                  }} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Harga Satuan (Rp)</Label>
                  <Input type="number" value={item.unit_price} onChange={e => {
                    const newItems = [...items]; newItems[index].unit_price = e.target.value as any; setItems(newItems);
                  }} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-xs">Subtotal</Label>
                  <Input type="text" readOnly disabled value={(Number(item.qty) * Number(item.unit_price)).toLocaleString('id-ID')} />
                </div>
                <div className="col-span-1 pb-1 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => setItems((Array.isArray(items) ? items : []).filter((_, i) => i !== index))}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Belum ada barang ditambahkan.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pembayaran & Piutang</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Tagihan:</span>
              <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Jumlah Dibayar (Rp)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  placeholder="Kosongkan jika belum bayar sama sekali" 
                  value={paidAmount} 
                  onChange={e => setPaidAmount(e.target.value ? Number(e.target.value) : "")} 
                />
                <p className="text-xs text-muted-foreground">
                  Isi sesuai nominal yang dibayar customer saat ini.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Sisa Piutang (Rp)</Label>
                <Input 
                  type="text" 
                  readOnly 
                  disabled 
                  value={piutang.toLocaleString('id-ID')} 
                  className={piutang > 0 ? "text-amber-600 font-bold bg-amber-50" : "text-green-600 font-bold bg-green-50"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
          {loading ? "Menyimpan..." : "Buat Sales Order"}
        </Button>
      </form>
    </div>
  )
}
