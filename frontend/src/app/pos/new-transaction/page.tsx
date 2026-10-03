"use client"

import { useState, useEffect } from"react"
import { 
 Card, CardContent, CardHeader, CardTitle, CardFooter
} from"@/components/ui/card"
import { Input } from"@/components/ui/input"
import { Button } from"@/components/ui/button"
import { Badge } from"@/components/ui/badge"
import { ScrollArea } from"@/components/ui/scroll-area"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from"@/components/ui/dialog"
import { 
 Search, ScanLine, ShoppingCart, Plus, Minus, 
 Trash2, CreditCard, Banknote, QrCode, User, AlertTriangle
} from"lucide-react"
import { InventoryAPI, PosAPI, api } from"@/lib/api"

type CartItem = {
 id: string
 name: string
 price: number
 qty: number
}

export default function PosTransaction() {
 const [activeCategory, setActiveCategory] = useState("Semua")
 const [searchQuery, setSearchQuery] = useState("")
 const [cart, setCart] = useState<CartItem[]>([])
 const [isPaymentOpen, setIsPaymentOpen] = useState(false)
 const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [paidAmount, setPaidAmount] = useState<number | "">(0)
   const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")
  
  useEffect(() => {
     api.get("/customers?limit=100").then(res => {
         if (res.data?.data) setCustomers(res.data.data)
     }).catch(console.error)
  }, [])

  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
 const [isTaxEnabled, setIsTaxEnabled] = useState(true)
 const [idempotencyKey, setIdempotencyKey] = useState("")

 useEffect(() => {
   setIdempotencyKey(crypto.randomUUID())
 }, [])

 const [loading, setLoading] = useState(true)
 const [isError, setIsError] = useState(false)
 const [products, setProducts] = useState<any[]>([])
 const [categories, setCategories] = useState<string[]>(["Semua"])
 const [warehouses, setWarehouses] = useState<any[]>([])
 const [selectedWarehouse, setSelectedWarehouse] = useState("")

 useEffect(() => {
 async function fetchData() {
 try {
 setLoading(true)
 setIsError(false)
 const [dbProducts, dbWarehouses] = await Promise.all([
 InventoryAPI.getProducts(),
 InventoryAPI.getWarehouses().catch(() => [])
 ])
 
 if (dbWarehouses && dbWarehouses.length > 0) {
 setWarehouses(dbWarehouses)
 // Use active warehouse from header selector, fallback to first
 const storedWh = typeof window !== 'undefined' ? localStorage.getItem('active_warehouse') : null;
 const activeWh = storedWh && storedWh !== 'null' && storedWh !== 'undefined' ? JSON.parse(storedWh) : null;
 const matchWh = activeWh ? dbWarehouses.find((w: any) => w.id === activeWh.id) : null;
 setSelectedWarehouse(matchWh ? matchWh.id : dbWarehouses[0].id)
 }

 // Map Prisma products to UI format
 const mapped = dbProducts.map((p: any) => ({
 id: p.id,
 name: p.name,
 category: p.category?.name ||"Lainnya",
 price: Number(p.selling_price),
 stock: (() => {
     const storedWh2 = typeof window !== 'undefined' ? localStorage.getItem('active_warehouse') : null;
     const activeWh2 = storedWh2 && storedWh2 !== 'null' && storedWh2 !== 'undefined' ? JSON.parse(storedWh2) : null;
     if (activeWh2) {
       const whStock = p.warehouse_stocks?.find((ws: any) => ws.warehouse_id === activeWh2.id);
       return whStock?.current_stock || 0;
     }
     return p.warehouse_stocks?.reduce((acc: number, ws: any) => acc + ws.current_stock, 0) || 0;
   })(),
 img:"📦" // default icon
 }))
 setProducts(mapped)

 // Extract unique categories
 const uniqueCategories = ["Semua", ...new Set(mapped.map((p: any) => p.category))] as string[]
 setCategories(uniqueCategories)
 } catch (error) {
 console.error("Database connection failed:", error)
 setIsError(true)
 setProducts([]) // No dummy data
 } finally {
 setLoading(false)
 }
 }
 fetchData()
 }, [])

 const formatIDR = (value: number) => {
 return new Intl.NumberFormat("id-ID", {
 style:"currency",
 currency:"IDR",
 maximumFractionDigits: 0
 }).format(value)
 }

 const filteredProducts = (Array.isArray(products) ? products : []).filter(p => 
 (activeCategory ==="Semua" || p.category === activeCategory) &&
 p.name.toLowerCase().includes(searchQuery.toLowerCase())
 )

 const addToCart = (product: any) => {
 setCart(prev => {
 const existing = prev.find(item => item.id === product.id)
 if (existing) {
 return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
 }
 return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }]
 })
 }

 const updateQty = (id: string, delta: number) => {
 setCart(prev => prev.map(item => {
 if (item.id === id) {
 const newQty = item.qty + delta
 return newQty > 0 ? { ...item, qty: newQty } : item
 }
 return item
 }))
 }

 const removeFromCart = (id: string) => {
 setCart(prev => prev.filter(item => item.id !== id))
 }

 const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
 const taxAmount = subtotal * 0.11
 const tax = isTaxEnabled ? taxAmount : 0
 const total = subtotal + tax

 return (
 <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 animate-in fade-in duration-500">
 {/* LEFT PANE - PRODUCTS */}
 <div className="flex-1 flex flex-col gap-4">
 {/* Top Actions */}
 <div className="flex items-center gap-3">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input 
 placeholder="Cari produk atau scan barcode..." 
 className="pl-9 bg-card border-border"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 <Button variant="outline" className="shrink-0 gap-2 border-border bg-card">
 <ScanLine className="w-4 h-4" /> Barcode
 </Button>
 </div>

 {/* Categories */}
 <ScrollArea className="w-full whitespace-nowrap pb-2">
 <div className="flex w-max gap-2 px-1">
 {categories.map(c => (
 <Button 
 key={c}
 variant={activeCategory === c ?"default" :"outline"}
 className={`rounded-full px-5 ${activeCategory === c ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20' : 'bg-card border-border text-muted-foreground'}`}
 onClick={() => setActiveCategory(c)}
 >
 {c}
 </Button>
 ))}
 </div>
 </ScrollArea>

 {/* Product Grid */}
 <ScrollArea className="flex-1 -mx-2 px-2">
 {isError && (
 <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
 <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
 <div>
 <h4 className="font-semibold text-destructive">Koneksi Database Terputus</h4>
 <p className="text-sm text-destructive/80">Saat ini tidak dapat mengambil data dari server MongoDB.</p>
 </div>
 </div>
 )}
 <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
 {filteredProducts.map(p => (
 <Card 
 key={p.id} 
 className="cursor-pointer border-border bg-card hover:border-primary transition-colors shadow-sm group overflow-hidden"
 onClick={() => addToCart(p)}
 >
 <div className="h-32 bg-accent/50 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300">
 {p.img}
 </div>
 <CardContent className="p-3">
 <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">{p.name}</h3>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mt-2">
 <p className="font-bold text-primary text-sm">{formatIDR(p.price)}</p>
 <Badge variant="outline" className={`text-[10px] px-1.5 ${p.stock > 0 ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
 Stok: {p.stock}
 </Badge>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </ScrollArea>
 </div>

 {/* RIGHT PANE - CART */}
 <Card className="w-full lg:w-[400px] flex flex-col border-border bg-card shadow-lg overflow-hidden shrink-0">
 <CardHeader className="border-b border-border py-4 bg-accent/30">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
 <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
 <ShoppingCart className="w-5 h-5 text-primary" /> Keranjang
 </CardTitle>
 <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none transition-colors">
 {cart.length} Item
 </Badge>
 </div>
 <div className="mt-3 flex items-center gap-2 bg-card p-2 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors">
 <User className="w-4 h-4 text-muted-foreground" />
 <span className="text-sm font-medium text-muted-foreground">Pilih Pelanggan...</span>
 </div>
 </CardHeader>
 
 <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
 {cart.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
 <ShoppingCart className="w-12 h-12 opacity-20" />
 <p className="text-sm">Keranjang masih kosong</p>
 </div>
 ) : (
 <ScrollArea className="flex-1 px-4 py-2">
 <div className="space-y-4 pt-2">
 {cart.map(item => (
 <div key={item.id} className="flex gap-3 items-center group">
 <div className="flex-1">
 <h4 className="font-medium text-sm text-foreground leading-tight">{item.name}</h4>
 <p className="text-xs text-primary font-semibold mt-0.5">{formatIDR(item.price)}</p>
 </div>
 <div className="flex items-center gap-2 bg-accent/50 rounded-lg p-1 border border-border">
 <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-card" onClick={() => updateQty(item.id, -1)}>
 <Minus className="w-3 h-3" />
 </Button>
 <input type="number" step="any" min="0" value={item.qty} onChange={(e) => {
  const v = e.target.value === "" ? 0 : parseFloat(e.target.value);
  setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: v } : i));
}} className="w-16 text-center text-sm font-bold bg-transparent outline-none" />
 <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-card" onClick={() => updateQty(item.id, 1)}>
 <Plus className="w-3 h-3" />
 </Button>
 </div>
 <p className="font-bold text-sm w-[80px] text-right text-foreground">
 {formatIDR(item.price * item.qty)}
 </p>
 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFromCart(item.id)}>
 <Trash2 className="w-4 h-4" />
 </Button>
 </div>
 ))}
 </div>
 </ScrollArea>
 )}
 </CardContent>

 <CardFooter className="flex flex-col border-t border-border p-4 bg-accent/30 gap-4">
 <div className="w-full space-y-2">
 <div className="flex justify-between text-sm text-muted-foreground">
 <span>Subtotal</span>
 <span className="font-medium text-foreground">{formatIDR(subtotal)}</span>
 </div>
 <div 
 className="flex justify-between text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors select-none group"
 onClick={() => setIsTaxEnabled(!isTaxEnabled)}
 >
 <div className="flex items-center gap-1.5">
 <span>Pajak (11%)</span>
 {isTaxEnabled ? (
 <Badge variant="outline" className="h-4 px-1 text-[9px] bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/20">ON</Badge>
 ) : (
 <Badge variant="outline" className="h-4 px-1 text-[9px] bg-muted text-muted-foreground border-muted-foreground/20 group-hover:text-primary">OFF</Badge>
 )}
 </div>
 <span className={`font-medium ${!isTaxEnabled ? 'line-through opacity-50' : 'text-foreground'}`}>
 {formatIDR(taxAmount)}
 </span>
 </div>
 <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t border-border border-dashed mt-2">
 <span>Total</span>
 <span>{formatIDR(total)}</span>
 </div>
 </div>
 
 <Button 
 className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
 disabled={cart.length === 0}
 onClick={() => setIsPaymentOpen(true)}
 >
 BAYAR SEKARANG
 </Button>
 </CardFooter>
 </Card>

 {/* PAYMENT MODAL */}
 <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle className="text-xl">Proses Pembayaran</DialogTitle>
 <DialogDescription>
 Pilih metode pembayaran untuk menyelesaikan transaksi.
 </DialogDescription>
 </DialogHeader>
 
 <div className="py-4 space-y-6">
 <div className="space-y-2">
    <div className="flex justify-between items-center">
       <p className="text-sm font-medium text-foreground">Pelanggan</p>
       <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setIsNewCustomer(!isNewCustomer)}>
          {isNewCustomer ? "Pilih Eksisting" : "+ Pelanggan Baru"}
       </Button>
    </div>
    {isNewCustomer ? (
       <div className="flex flex-col gap-2">
           <div className="flex gap-2">
             <Input placeholder="Nama" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
             <Input placeholder="No HP" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
           </div>
           <Input placeholder="Alamat (Opsional)" value={newCustomerAddress} onChange={e => setNewCustomerAddress(e.target.value)} />
         </div>
    ) : (
       <select 
         className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
         value={selectedCustomerId}
         onChange={(e) => setSelectedCustomerId(e.target.value)}
       >
         <option value="">-- Umum / Tanpa Nama --</option>
         {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? ` - ${c.phone}` : ""}</option>)}
       </select>
    )}
</div>

<div className="text-center p-4 bg-accent rounded-xl border border-border">
 <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Total Tagihan</p>
 <h2 className="text-3xl font-bold text-primary">{formatIDR(total)}</h2>
 </div>

 <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground">Jumlah Pembayaran</p>
                <button type="button" onClick={() => setPaidAmount(total)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-md transition-colors shadow-sm">Bayar Lunas</button>
              </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">Rp</span>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : "")}
                className="w-full pl-9 pr-3 py-3 rounded-md border border-border bg-background font-semibold text-lg"
              />
            </div>
            {(paidAmount || 0) > total && (
               <p className="text-xs text-red-500 font-medium mt-1">Jumlah pembayaran melebihi sisa tagihan.</p>
            )}
            <div className="flex justify-between items-center text-sm font-medium mt-2">
              <span className="text-muted-foreground">Sisa Tagihan:</span>
              <span className="text-foreground">{formatIDR(Math.max(0, total - (paidAmount || 0)))}</span>
            </div>
          </div>

          <p className="text-sm font-medium text-foreground mt-4">Metode Pembayaran</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <Button 
 variant="outline" 
 className={`h-16 flex flex-col gap-1 border-2 ${paymentMethod === 'CASH' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
 onClick={() => setPaymentMethod('CASH')}
 >
 <Banknote className="w-5 h-5" />
 <span>Tunai</span>
 </Button>
 <Button 
 variant="outline" 
 className={`h-16 flex flex-col gap-1 border-2 ${paymentMethod === 'QRIS' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
 onClick={() => setPaymentMethod('QRIS')}
 >
 <QrCode className="w-5 h-5" />
 <span>QRIS</span>
 </Button>
 <Button 
 variant="outline" 
 className={`h-16 flex flex-col gap-1 border-2 ${paymentMethod === 'EDC' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
 onClick={() => setPaymentMethod('EDC')}
 >
 <CreditCard className="w-5 h-5" />
 <span>Kartu Debit/Kredit</span>
 </Button>
 </div>
 </div>
 
 <DialogFooter>
 <Button variant="outline" onClick={() => setIsPaymentOpen(false)} disabled={isCheckingOut || (paidAmount || 0) > total}>Batal</Button>
 <Button 
 className="bg-primary hover:bg-primary/90 text-primary-foreground" 
 disabled={isCheckingOut}
 onClick={async () => {
 setIsCheckingOut(true);
 try {
 const payload = {
 warehouseId: selectedWarehouse || undefined,
 paymentMethod,
 idempotency_key: idempotencyKey,
   partnerId: !isNewCustomer ? selectedCustomerId : undefined,
   newCustomerName: isNewCustomer ? newCustomerName : undefined,
   newCustomerPhone: isNewCustomer ? newCustomerPhone : undefined,
   newCustomerAddress: isNewCustomer ? newCustomerAddress : undefined,
   paidAmount,
 items: cart.map(item => ({ productId: item.id, qty: item.qty, price: item.price })),
 subtotal,
 tax,
 total
 };
 const checkoutResult = await PosAPI.checkout(payload);
 const _user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('erp_user') || '{}') : {};
 const _activeWh = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('active_warehouse') || 'null') : null;
 setReceiptData({
   orderNumber: checkoutResult?.data?.order_number || checkoutResult?.order_number || ('POS-' + Date.now()),
   date: new Date(),
   items: cart.map((item) => ({ ...item })),
   subtotal,
   tax,
   total,
   paidAmount: Number(paidAmount) || total,
   change: Math.max(0, (Number(paidAmount) || total) - total),
   paymentMethod,
   cashierName: _user?.name || 'Kasir',
   warehouseName: _activeWh?.name || 'Pusat',
   customerName: isNewCustomer ? newCustomerName : (customers.find((c) => c.id === selectedCustomerId)?.name || ''),
   customerAddress: isNewCustomer ? newCustomerAddress : (customers.find((c) => c.id === selectedCustomerId)?.address || ''),
 });
 setIsReceiptOpen(true);
 setCart([]);
 setIsPaymentOpen(false);
 setIdempotencyKey(crypto.randomUUID());
 } catch (error: any) {
 console.error("Checkout failed", error);
 const errMessage = error?.response?.data?.error?.message || error?.response?.data?.message || error.message ||"Unknown error";
 alert(`Gagal terhubung ke Database. Error: ${errMessage}`);
 setCart([]);
 setIsPaymentOpen(false);
 setIdempotencyKey(crypto.randomUUID());
 } finally {
 setIsCheckingOut(false);
 }
 }}
 >
 {isCheckingOut ?"Memproses..." :"Proses Transaksi"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

      {/* ====== RECEIPT MODAL ====== */}
      {receiptData && (
        <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
          <DialogContent className="max-w-sm p-0 overflow-hidden">
            <div id="pos-receipt" className="bg-white text-gray-900 p-6 font-mono text-sm">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="font-bold text-lg uppercase tracking-widest">STRUK PEMBAYARAN</div>
                <div className="text-xs text-gray-500">{receiptData.warehouseName}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(receiptData.date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</div>
              </div>

              {/* Order Info */}
              <div className="border-t border-dashed border-gray-300 pt-3 mb-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>No. Transaksi</span>
                  <span className="font-semibold text-gray-700">{receiptData.orderNumber}</span>
                </div>
                {receiptData.customerName && (
                  <>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Pelanggan</span>
                      <span className="font-semibold text-gray-700">{receiptData.customerName}</span>
                    </div>
                    {receiptData.customerAddress && (
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Alamat</span>
                        <span className="font-medium text-gray-700 text-right max-w-[60%] line-clamp-2">{receiptData.customerAddress}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Kasir</span>
                  <span className="font-semibold text-gray-700">{receiptData.cashierName}</span>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-dashed border-gray-300 py-3 mb-3">
                {receiptData.items.map((item: any, i: number) => (
                  <div key={i} className="mb-2">
                    <div className="font-medium text-gray-800 truncate">{item.name}</div>
                    <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                      <span>{item.qty} x Rp {Math.round(item.price).toLocaleString('id-ID')}</span>
                      <span className="font-semibold text-gray-700">Rp {Math.round(item.qty * item.price).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-gray-300 pt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Subtotal</span>
                  <span>Rp {Math.round(receiptData.subtotal).toLocaleString('id-ID')}</span>
                </div>
                {receiptData.tax > 0 && (
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>PPN (11%)</span>
                    <span>Rp {Math.round(receiptData.tax).toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base mt-2 text-gray-900">
                  <span>TOTAL</span>
                  <span>Rp {Math.round(receiptData.total).toLocaleString('id-ID')}</span>
                </div>
                <div className="border-t border-dashed border-gray-300 my-2" />
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Metode Bayar</span>
                  <span className="font-medium">{receiptData.paymentMethod === 'CASH' ? 'Tunai' : receiptData.paymentMethod === 'TRANSFER' ? 'Transfer' : receiptData.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Dibayar</span>
                  <span className="font-medium">Rp {Math.round(receiptData.paidAmount).toLocaleString('id-ID')}</span>
                </div>
                {receiptData.change > 0 && (
                  <div className="flex justify-between text-xs font-bold text-green-700 mt-1">
                    <span>Kembalian</span>
                    <span>Rp {Math.round(receiptData.change).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {receiptData.paidAmount < receiptData.total && (
                  <div className="flex justify-between text-xs font-bold text-amber-600 mt-1">
                    <span>Sisa Piutang</span>
                    <span>Rp {Math.round(receiptData.total - receiptData.paidAmount).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center mt-4 text-xs text-gray-400 border-t border-dashed border-gray-300 pt-3">
                <div>Terima kasih atas pembelian Anda!</div>
                <div className="mt-1">Barang yang sudah dibeli tidak dapat dikembalikan.</div>
              </div>
            </div>

            {/* Print & Close buttons — hidden when printing */}
            <div className="flex gap-2 p-4 bg-gray-50 border-t print:hidden">
              <button
                onClick={() => {
                  const printContents = document.getElementById('pos-receipt')?.innerHTML || '';
                  const win = window.open('', '_blank', 'width=400,height=600');
                  if (win) {
                    win.document.write(`<!DOCTYPE html><html><head><title>Struk</title><style>
                      body { font-family: monospace; font-size: 12px; color: #111; margin: 0; padding: 16px; }
                      @media print { body { margin: 0; } }
                    </style></head><body>${printContents}<script>window.onload=function(){window.print();window.close();}<\/script></body></html>`);
                    win.document.close();
                  }
                }}
                className="flex-1 bg-gray-900 text-white text-sm font-medium py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                🖨️ Print Struk
              </button>
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                Tutup
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
 </div>
 )
}

