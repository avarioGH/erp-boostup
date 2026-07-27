"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Search, Plus, Filter, Download, Box, LayoutGrid, AlertTriangle, RefreshCcw
} from "lucide-react"
import { InventoryAPI } from "@/lib/api"

// Mock Data Fallback
const fallbackProducts = [
  { 
    id: 1, sku: "KOP-001", name: "Kopi Arabica Premium 1Kg", category: "Biji Kopi", 
    price: 120000, 
    stock_a: 120, stock_b: 53, stock_c: 80 
  },
  { 
    id: 2, sku: "KOP-002", name: "Biji Kopi Robusta 1Kg", category: "Biji Kopi", 
    price: 90000, 
    stock_a: 12, stock_b: 45, stock_c: 30 
  },
  { 
    id: 3, sku: "SYR-001", name: "Sirup Caramel Monin 700ml", category: "Sirup & Perasa", 
    price: 185000, 
    stock_a: 24, stock_b: 15, stock_c: 40 
  },
  { 
    id: 4, sku: "PKG-001", name: "Gelas Kertas 8oz", category: "Kemasan", 
    price: 1500, 
    stock_a: 3500, stock_b: 1200, stock_c: 5000 
  },
  { 
    id: 5, sku: "PKG-002", name: "Cup Lid Sealer", category: "Kemasan", 
    price: 50000, 
    stock_a: 15, stock_b: 5, stock_c: 20 
  },
  { 
    id: 6, sku: "MTL-001", name: "Sedotan Ramah Lingkungan", category: "Peralatan", 
    price: 25000, 
    stock_a: 80, stock_b: 100, stock_c: 150 
  },
  { 
    id: 7, sku: "SYR-002", name: "Gula Aren Cair 1L", category: "Sirup & Perasa", 
    price: 45000, 
    stock_a: 40, stock_b: 25, stock_c: 2 
  },
]

export default function ProductInventory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ code: "", name: "", purchasePrice: "", sellingPrice: "", description: "" })

  // Real DB States
  const [loading, setLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setIsError(false)
        const [dbProducts, whs] = await Promise.all([
          InventoryAPI.getProducts(),
          InventoryAPI.getWarehouses()
        ])
        setWarehouses(whs)
        
        // Map Prisma products to UI format
        const mapped = dbProducts.map((p: any) => {
          // Map stocks by warehouse ID
          const stockMap: Record<string, number> = {}
          p.warehouse_stocks?.forEach((ws: any) => {
            stockMap[ws.warehouse_id] = ws.current_stock
          })
          
          return {
            id: p.id,
            sku: p.code,
            name: p.name,
            category: p.category?.name || "-",
            price: Number(p.selling_price),
            stockMap
          }
        })
        setProducts(mapped)
      } catch (error) {
        console.error("Database connection failed:", error)
        setIsError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await InventoryAPI.createProduct({
        code: formData.code,
        name: formData.name,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        description: formData.description
      })
      setShowForm(false)
      setFormData({ code: "", name: "", purchasePrice: "", sellingPrice: "", description: "" })
      // Refetch products
      const dbProducts = await InventoryAPI.getProducts()
      const mapped = dbProducts.map((p: any) => {
        const stockMap: Record<string, number> = {}
        p.warehouse_stocks?.forEach((ws: any) => { stockMap[ws.warehouse_id] = ws.current_stock })
        return {
          id: p.id,
          sku: p.code,
          name: p.name,
          category: p.category?.name || "-",
          price: Number(p.selling_price),
          stockMap
        }
      })
      setProducts(mapped)
    } catch (error) {
      console.error(error)
      alert("Gagal menambahkan produk")
    }
  }

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value)
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Box className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> Manajemen Produk
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau pergerakan stok multi-gudang dan katalog produk Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20">
            <Plus className="w-4 h-4" /> {showForm ? "Batal" : "Tambah Produk"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-t-4 border-t-indigo-600 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSave}>
            <CardHeader>
              <CardTitle>Tambah Produk Baru</CardTitle>
              <CardDescription>
                Masukkan detail produk baru Anda. Klik simpan setelah selesai.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SKU / Kode Produk (Opsional)</Label>
                <Input 
                  placeholder="Misal: PRD-001" 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Produk <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="Masukkan nama produk" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Harga Beli <span className="text-red-500">*</span></Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={formData.purchasePrice} 
                    onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Harga Jual <span className="text-red-500">*</span></Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={formData.sellingPrice} 
                    onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Tambahan</Label>
                <Input 
                  placeholder="Deskripsi singkat produk" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Batal</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Simpan Produk</Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-[#0F172A]/50">
          <div className="relative w-full sm:w-[350px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari nama produk atau SKU..." 
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Filter className="w-4 h-4" /> Filter Kategori
            </Button>
            <Button variant="outline" size="sm" className="gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <LayoutGrid className="w-4 h-4" /> Kolom
            </Button>
          </div>
        </div>

        {isError && (
          <div className="m-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-rose-700">Koneksi Database Terputus</h4>
              <p className="text-sm text-rose-600">Saat ini menampilkan data dummy karena server PostgreSQL tidak dapat dihubungi. Silakan jalankan 'npx prisma db seed' di server Anda.</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow className="border-slate-100 dark:border-slate-800">
                <TableHead className="w-[100px] font-semibold">SKU</TableHead>
                <TableHead className="font-semibold">Nama Produk</TableHead>
                <TableHead className="font-semibold">Kategori</TableHead>
                <TableHead className="text-right font-semibold">Harga Jual</TableHead>
                {warehouses.map((wh) => (
                  <TableHead key={wh.id} className="text-center font-semibold bg-indigo-50/50 dark:bg-indigo-900/10 border-l border-r border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold tracking-widest mb-1">{wh.name}</span>
                      <span className="text-[10px] text-slate-500">{wh.location || "Cabang"}</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold">Total Stok</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5 + warehouses.length} className="h-32 text-center text-slate-500">
                    Tidak ada produk yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => {
                  const totalStock = warehouses.reduce((sum, wh) => sum + (p.stockMap[wh.id] || 0), 0);
                  return (
                    <TableRow key={p.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <TableCell className="font-mono text-xs text-slate-500">{p.sku}</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">{p.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium rounded-md">
                          {p.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatIDR(p.price)}</TableCell>
                      
                      {warehouses.map((wh) => {
                        const stock = p.stockMap[wh.id] || 0;
                        return (
                          <TableCell key={wh.id} className="text-center border-l border-r border-indigo-50 dark:border-indigo-900/20 bg-indigo-50/30 dark:bg-indigo-900/5 group-hover:bg-indigo-50/80 dark:group-hover:bg-indigo-900/20">
                            <span className={`font-semibold ${stock < 10 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                              {stock}
                            </span>
                          </TableCell>
                        );
                      })}
                      
                      {/* Total */}
                      <TableCell className="text-center">
                        <Badge className={`${
                          totalStock < 50 ? 'bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 border-none' : 
                          'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-none'
                        } font-bold px-2 py-0.5`}>
                          {totalStock}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
