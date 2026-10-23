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

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, ArrowLeft, Plus, X, AlertCircle, Clock, ShoppingCart } from 'lucide-react'
import { useRef } from "react"
import { formatThousands, parseThousands } from "@/lib/utils"

function SearchableSelect({ options, value, onChange, placeholder, disabled = false }: any) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  
  const getDisplay = (o: any) => {
    if (!o) return "";
    let text = o.name || o.code || "";
    if (o.phone) text += ` (${o.phone})`;
    else if (o.code && !o.code.startsWith('CUST-') && !o.code.startsWith('SUP-') && !o.code.startsWith('VEND-')) {
      text = `${o.code} - ${text}`;
    }
    // Jika merupakan produk, tampilkan stok storage yang ada
    if (o.warehouse_stocks !== undefined) {
      const stock = o.warehouse_stocks?.reduce((s: number, ws: any) => s + (Number(ws.current_stock) || 0), 0) || 0;
      const unitName = o.unit?.name || 'unit';
      text += ` [Stok: ${stock} ${unitName}]`;
    }
    return text;
  };
  const selectedOption = options?.find((o: any) => o.id === value || o._id === value) || (typeof value === 'object' ? value : null)
  const displayValue = open ? search : (selectedOption ? getDisplay(selectedOption) : '')

  const filteredOptions = (options || []).filter((o: any) => 
    (o.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (o.code || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Input 
          disabled={disabled}
          value={displayValue}
          onChange={e => { setSearch(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setSearch(""); }}
          placeholder={selectedOption ? getDisplay(selectedOption) : (placeholder || "Pilih...")}
          className="w-full pr-8 cursor-pointer bg-accent/30"
          readOnly={!open}
        />
        <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground pointer-events-none" />
      </div>
      
      {open && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border shadow-md rounded-md max-h-60 overflow-y-auto" style={{ display: 'block' }}>
          <div className="p-1 sticky top-0 bg-popover/90 backdrop-blur-sm border-b">
             <Input 
               autoFocus
               value={search}
               onChange={e => setSearch(e.target.value)}
               placeholder="Cari..."
               className="h-8 text-sm"
             />
          </div>
          {(!filteredOptions || filteredOptions.length === 0) ? (
            <div className="p-3 text-sm text-center text-red-500 bg-red-100 font-bold border border-red-500">
              Tidak ditemukan!
            </div>
          ) : (
            filteredOptions.map((o: any, i: number) => (
              <div 
                key={o?.id || o?._id || i} 
                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent text-foreground"
                style={{ minHeight: '36px', display: 'block', borderBottom: '1px solid #333' }}
                onClick={() => { onChange(o?.id || o?._id); setOpen(false); setSearch(""); }}
              >
                {getDisplay(o)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}


export default function CreateSalesOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" })

  const handleCreateCustomer = async () => {
    try {
      setIsCreatingCustomer(true)
      const res = await api.post('/customers', newCustomer)
      if (res.data) {
        toast({ title: "Pelanggan berhasil ditambahkan!" })
        setNewCustomerOpen(false)
        const activeWh = typeof window !== 'undefined' ? localStorage.getItem('active_warehouse') : '';
        // Refetch customers
        api.get('/customers?limit=1000').then(c => {
          setCustomers(c?.data?.data || c?.data || [])
          setForm(prev => ({...prev, partner_id: res.data.id || res.data._id}))
        })
        setNewCustomer({ name: "", phone: "" })
      }
    } catch (err: any) {
      toast({ title: "Gagal menambah pelanggan", description: (err.response?.data?.error?.message || err.response?.data?.message) || err.message, variant: "destructive" })
    } finally {
      setIsCreatingCustomer(false)
    }
  }
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  const [form, setForm] = useState({
    partner_id: "",
    order_date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    notes: "",
    payment_method: "Transfer"
  })

  const [items, setItems] = useState([
    { product_id: "", qty: 1, unit_price: 0 }
  ])

  const [paidAmount, setPaidAmount] = useState<number | "">("")
  const [orderType, setOrderType] = useState<'DIRECT' | 'PREORDER'>('DIRECT')

  useEffect(() => {
    Promise.all([
      api.get('/customers?limit=1000').then(res => res.data).catch(() => []), 
      InventoryAPI.getProducts().catch(() => [])
    ]).then(([cust, prod]) => {
      setCustomers(cust?.data || cust || [])
      setProducts(prod?.data || prod || [])
    })
  }, [])

  const getProductStock = (productId: string) => {
    const prod = products.find((p: any) => p.id === productId || p._id === productId);
    if (!prod) return 0;
    return prod.warehouse_stocks?.reduce((s: number, ws: any) => s + (Number(ws.current_stock) || 0), 0) || 0;
  };

  const hasInsufficientStock = items.some(item => {
    if (!item.product_id) return false;
    const stock = getProductStock(item.product_id);
    return Number(item.qty) > stock;
  });

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unit_price)), 0)
  const dibayar = Number(paidAmount) || 0
  const piutang = Math.max(0, totalAmount - dibayar)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!form.partner_id) return toast({ title: "Pilih Pelanggan", variant: "destructive" })
    if (items.length === 0) return toast({ title: "Tambah minimal 1 barang", variant: "destructive" })
    
    // Validasi stok jika penjualan langsung
    if (orderType === 'DIRECT') {
      for (const item of items) {
        const prod = products.find((p: any) => p.id === item.product_id || p._id === item.product_id);
        const stock = getProductStock(item.product_id);
        if (Number(item.qty) > stock) {
          toast({ 
            title: "Stok Gudang Tidak Cukup", 
            description: `Stok "${prod?.name || 'Produk'}" hanya ada ${stock}, tetapi Anda memesan ${item.qty}. Silakan ubah Qty atau ubah tipe order menjadi Pre-Order!`, 
            variant: "destructive" 
          });
          return;
        }
      }
    }

    setLoading(true)
    try {
      await B2BApi.createOrder({
        ...form,
        customer_id: form.partner_id,
        items,
        total_amount: totalAmount,
        paidAmount: paidAmount === "" ? undefined : Number(paidAmount),
        is_preorder: orderType === 'PREORDER',
        status: orderType === 'PREORDER' ? 'PREORDER' : 'COMPLETED'
      })
      toast({ 
        title: orderType === 'PREORDER' ? "Pre-Order Berhasil Dibuat!" : "Sales Order Berhasil Dibuat!",
        description: orderType === 'PREORDER' ? "Pesanan dicatat tanpa memotong stok gudang." : undefined
      })
      router.push("/sales/orders")
    } catch(err: any) {
      toast({ 
        title: "Gagal membuat Order", 
        description: err?.response?.data?.message || err?.message,
        variant: "destructive" 
      })
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
        <Card className="overflow-visible">
          <CardHeader><CardTitle>Data Utama</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <Label>Pelanggan (Customer)</Label>
                <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
                  <DialogTrigger>
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2"><Plus className="w-3 h-3 mr-1"/> Baru</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nama Pelanggan</Label>
                        <Input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Masukkan nama..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Nomor HP / Telepon</Label>
                        <Input value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="08xxx" />
                      </div>
                      <Button className="w-full" onClick={handleCreateCustomer} disabled={!newCustomer.name || isCreatingCustomer}>
                        {isCreatingCustomer ? "Menyimpan..." : "Simpan Pelanggan"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <SearchableSelect 
                options={customers} 
                value={form.partner_id} 
                onChange={(v: any) => setForm({...form, partner_id: v})} 
                placeholder="Pilih Pelanggan..." 
              />
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
              <Label>Tipe Order Penjualan</Label>
              <Select value={orderType} onValueChange={(v: any) => setOrderType(v || 'DIRECT')}>
                <SelectTrigger className="font-semibold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-emerald-600" />
                      <span>Penjualan Langsung (Kirim dari Stok Storage)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PREORDER">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>Pre-Order (PO Pelanggan - Tunggu Stok Masuk)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {orderType === 'DIRECT' 
                  ? 'Stok fisik gudang wajib mencukupi dan akan langsung dipotong.' 
                  : 'Gunakan jika stok belum ada/kurang. Stok TIDAK dipotong sekarang, menunggu stok diisi di inventori.'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Catatan Tambahan</Label>
              <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Catatan opsional..." />
            </div>
          </CardContent>
        </Card>

        {/* Warning Banner if Direct Order has insufficient stock */}
        {hasInsufficientStock && orderType === 'DIRECT' && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Peringatan: Qty Order Melebihi Stok Storage Yang Tersedia!</span>
            </div>
            <p className="text-xs">
              Ada barang dengan Qty yang diminta melebihi stok yang ada di gudang. Sistem melarang penjualan langsung jika stok kurang agar stok tidak minus.
            </p>
            <div className="pt-1">
              <Button 
                type="button" 
                size="sm" 
                onClick={() => setOrderType('PREORDER')}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" /> Ubah Menjadi Pre-Order (PO)
              </Button>
            </div>
          </div>
        )}

        {orderType === 'PREORDER' && (
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-400">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Mode Pre-Order Aktif</span>
            </div>
            <p className="text-xs mt-1">
              Pesanan ini dicatat sebagai Pre-Order. Stok tidak akan dipotong sekarang. Nanti saat ikan/stok sudah dibeli & masuk ke storage, Anda bisa menekan tombol <strong>"Kirim Pre-Order"</strong> di halaman Detail Sales Order.
            </p>
          </div>
        )}

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle>Rincian Barang</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { product_id: "", qty: 1, unit_price: 0 }])}>
              <Plus className="w-4 h-4 mr-2" /> Tambah Barang
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => {
              const currentStock = item.product_id ? getProductStock(item.product_id) : null;
              const isOverStock = currentStock !== null && Number(item.qty) > currentStock;
              const prod = products.find((p: any) => p.id === item.product_id || p._id === item.product_id);

              return (
                <div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-4">
                  <div className="col-span-5 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Barang</Label>
                      {currentStock !== null && (
                        <span className={`text-[11px] font-semibold ${isOverStock && orderType === 'DIRECT' ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                          Tersedia: {currentStock} {prod?.unit?.name || 'unit'}
                        </span>
                      )}
                    </div>
                    <SearchableSelect 
                      options={products}
                      value={item.product_id}
                      onChange={(v: any) => {
                        const newItems = [...items]; 
                        newItems[index].product_id = v;
                        const p = products.find((pr: any) => pr.id === v || pr._id === v);
                        if (p && p.sell_price) newItems[index].unit_price = p.sell_price;
                        setItems(newItems);
                      }}
                      placeholder="Pilih Produk..."
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Qty</Label>
                      {isOverStock && (
                        <span className={`text-[10px] font-semibold ${orderType === 'DIRECT' ? 'text-rose-600' : 'text-purple-600'}`}>
                          {orderType === 'DIRECT' ? 'Kurang!' : 'PO'}
                        </span>
                      )}
                    </div>
                    <Input 
                      type="number" 
                      step="any" 
                      min="0" 
                      value={item.qty} 
                      onChange={e => {
                        const newItems = [...items]; 
                        newItems[index].qty = e.target.value as any; 
                        setItems(newItems);
                      }} 
                      className={isOverStock && orderType === 'DIRECT' ? 'border-destructive focus-visible:ring-destructive font-bold' : ''}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Harga Satuan (Rp)</Label>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      value={formatThousands(item.unit_price)} 
                      onChange={e => {
                        const newItems = [...items]; 
                        newItems[index].unit_price = parseThousands(e.target.value); 
                        setItems(newItems);
                      }} 
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Subtotal</Label>
                    <Input type="text" readOnly disabled value={(Number(item.qty) * Number(item.unit_price)).toLocaleString('id-ID')} />
                  </div>
                  <div className="col-span-1 pb-1 flex justify-end">
                    <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => setItems((Array.isArray(items) ? items : []).filter((_, i) => i !== index))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Belum ada barang ditambahkan.</p>}
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader><CardTitle>Pembayaran & Piutang</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Tagihan:</span>
              <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Jumlah Dibayar (Rp)</Label>
                  <Button type="button" variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => setPaidAmount(totalAmount)}>
                    Dibayar Full
                  </Button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Rp</span>
                  <Input 
                    type="text"
                    inputMode="numeric"
                    placeholder="0" 
                    value={formatThousands(paidAmount)} 
                    onChange={e => {
                      const val = parseThousands(e.target.value);
                      setPaidAmount(val > 0 ? val : "");
                    }} 
                    className="pl-10 text-base font-bold"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Isi sesuai nominal yang dibayar customer saat ini (kosongkan jika tempo/belum bayar).
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

        <Button 
          type="submit" 
          disabled={loading || (orderType === 'DIRECT' && hasInsufficientStock)} 
          className={`w-full h-12 text-lg font-semibold ${orderType === 'PREORDER' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
        >
          {loading 
            ? "Menyimpan..." 
            : orderType === 'PREORDER' 
              ? "Buat Pre-Order (PO - Tunggu Stok Masuk)" 
              : "Buat Sales Order (Kirim Langsung)"}
        </Button>
      </form>
    </div>
  )
}
