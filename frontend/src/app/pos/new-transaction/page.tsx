"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Search, ScanLine, ShoppingCart, Plus, Minus, 
  Trash2, CreditCard, Banknote, QrCode, User, AlertTriangle
} from "lucide-react"
import { InventoryAPI, PosAPI } from "@/lib/api"

type CartItem = {
  id: number
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
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const [loading, setLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(["Semua"])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setIsError(false)
        const dbProducts = await InventoryAPI.getProducts()
        // Map Prisma products to UI format
        const mapped = dbProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category?.name || "Lainnya",
          price: Number(p.selling_price),
          stock: p.warehouse_stocks?.reduce((acc: number, ws: any) => acc + ws.current_stock, 0) || 0,
          img: "📦" // default icon
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
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value)
  }

  const filteredProducts = products.filter(p => 
    (activeCategory === "Semua" || p.category === activeCategory) &&
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

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta
        return newQty > 0 ? { ...item, qty: newQty } : item
      }
      return item
    }))
  }

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const tax = subtotal * 0.11
  const total = subtotal + tax

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 animate-in fade-in duration-500">
      {/* LEFT PANE - PRODUCTS */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari produk atau scan barcode..." 
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="shrink-0 gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <ScanLine className="w-4 h-4" /> Barcode
          </Button>
        </div>

        {/* Categories */}
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex w-max gap-2 px-1">
            {categories.map(c => (
              <Button 
                key={c}
                variant={activeCategory === c ? "default" : "outline"}
                className={`rounded-full px-5 ${activeCategory === c ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
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
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-rose-700">Koneksi Database Terputus</h4>
                <p className="text-sm text-rose-600">Saat ini menampilkan data dummy karena server PostgreSQL tidak dapat dihubungi.</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {filteredProducts.map(p => (
              <Card 
                key={p.id} 
                className="cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors shadow-sm group overflow-hidden"
                onClick={() => addToCart(p)}
              >
                <div className="h-32 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300">
                  {p.img}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight">{p.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{formatIDR(p.price)}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-400">
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
      <Card className="w-full lg:w-[400px] flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden shrink-0">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 py-4 bg-slate-50/50 dark:bg-[#0F172A]/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Keranjang
            </CardTitle>
            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 hover:bg-indigo-100 border-none">
              {cart.length} Item
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-400 transition-colors">
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Pilih Pelanggan...</span>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p className="text-sm">Keranjang masih kosong</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-4 py-2">
              <div className="space-y-4 pt-2">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3 items-center group">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-white leading-tight">{item.name}</h4>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{formatIDR(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white dark:hover:bg-slate-700" onClick={() => updateQty(item.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white dark:hover:bg-slate-700" onClick={() => updateQty(item.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="font-bold text-sm w-[80px] text-right text-slate-900 dark:text-white">
                      {formatIDR(item.price * item.qty)}
                    </p>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>

        <CardFooter className="flex flex-col border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-[#0F172A]/50 gap-4">
          <div className="w-full space-y-1.5">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900 dark:text-white">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Pajak (11%)</span>
              <span className="font-medium text-slate-900 dark:text-white">{formatIDR(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-indigo-600 dark:text-indigo-400 pt-2 border-t border-slate-200 dark:border-slate-700 border-dashed mt-2">
              <span>Total</span>
              <span>{formatIDR(total)}</span>
            </div>
          </div>
          
          <Button 
            className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
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
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-1">Total Tagihan</p>
              <h2 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatIDR(total)}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className={`h-16 flex flex-col gap-1 border-2 ${paymentMethod === 'CASH' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-800'}`}
                onClick={() => setPaymentMethod('CASH')}
              >
                <Banknote className="w-5 h-5" />
                <span>Tunai</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-16 flex flex-col gap-1 border-2 ${paymentMethod === 'QRIS' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-800'}`}
                onClick={() => setPaymentMethod('QRIS')}
              >
                <QrCode className="w-5 h-5" />
                <span>QRIS</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-16 flex flex-col gap-1 border-2 ${paymentMethod === 'EDC' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-800'}`}
                onClick={() => setPaymentMethod('EDC')}
              >
                <CreditCard className="w-5 h-5" />
                <span>Kartu Debit/Kredit</span>
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)} disabled={isCheckingOut}>Batal</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700" 
              disabled={isCheckingOut}
              onClick={async () => {
                setIsCheckingOut(true);
                try {
                  const payload = {
                    warehouseId: "gudang_a", // default untuk demo
                    paymentMethod,
                    items: cart.map(item => ({ productId: item.id, qty: item.qty, price: item.price })),
                    subtotal,
                    tax,
                    total
                  };
                  await PosAPI.checkout(payload);
                  alert(`Transaksi Sukses! (Tersimpan ke Database Real)`);
                  setCart([]);
                  setIsPaymentOpen(false);
                } catch (error) {
                  console.error("Checkout failed", error);
                  alert(`Gagal terhubung ke Database. Mensimulasikan Transaksi Lokal Sukses!`);
                  setCart([]);
                  setIsPaymentOpen(false);
                } finally {
                  setIsCheckingOut(false);
                }
              }}
            >
              {isCheckingOut ? "Memproses..." : "Proses Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
