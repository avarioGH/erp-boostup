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
  Search, Plus, Download, Box, LayoutGrid, AlertTriangle, RefreshCcw
} from "lucide-react"
import { InventoryAPI } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import imageCompression from "browser-image-compression"

import { Upload, X, QrCode, Edit } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ProductInventory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ 
    code: "", barcode: "", name: "", purchasePrice: "", sellingPrice: "", description: "", categoryId: "" 
  })
  const [images, setImages] = useState<File[]>([])
  
  // Real DB States
  const [loading, setLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState({
    sku: true,
    category: true,
    price: true,
    totalStock: true
  })

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setIsError(false)
        const [dbProducts, whs, cats] = await Promise.all([
          InventoryAPI.getProducts(),
          InventoryAPI.getWarehouses(),
          InventoryAPI.getCategories()
        ])
        setWarehouses(whs)
        setCategories(cats)
        
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

  const generateSKU = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setFormData({ ...formData, code: `PRD-${random}` });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // limit max 8
    const remainingSlots = 8 - images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFiles = await Promise.all(
        filesToProcess.map(async (file) => {
          const compressedFile = await imageCompression(file, options);
          return new File([compressedFile], file.name, { type: file.type });
        })
      );
      setImages(prev => [...prev, ...compressedFiles]);
    } catch (error) {
      console.error("Error compressing images:", error);
      alert("Gagal mengompres gambar.");
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = new FormData();
      payload.append("code", formData.code);
      payload.append("barcode", formData.barcode);
      payload.append("name", formData.name);
      payload.append("purchasePrice", formData.purchasePrice);
      payload.append("sellingPrice", formData.sellingPrice);
      payload.append("description", formData.description);
      payload.append("categoryId", formData.categoryId);
      
      images.forEach((img) => {
        payload.append("images", img);
      });

      await InventoryAPI.createProduct(payload)
      setShowForm(false)
      setFormData({ code: "", barcode: "", name: "", purchasePrice: "", sellingPrice: "", description: "", categoryId: "" })
      setImages([])
      
      // Refresh Data
      const dbProducts = await InventoryAPI.getProducts()
      const mapped = dbProducts.map((p: any) => {
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
      console.error("Failed to save product:", error)
      alert("Gagal menyimpan produk.")
    } finally {
      setIsSubmitting(false)
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
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle>Tambah Produk Baru</CardTitle>
              <CardDescription>
                Masukkan detail produk baru Anda. Lengkapi informasi dasar, harga, dan foto produk.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              
              {/* Section 1: Informasi Dasar */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Box className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-semibold text-sm text-foreground">Informasi Dasar</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU / Kode Produk <span className="text-red-500">*</span></Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Misal: PRD-001" 
                        value={formData.code} 
                        onChange={(e) => setFormData({...formData, code: e.target.value})} 
                        className="bg-accent/50 focus:bg-background"
                        required
                      />
                      <Button type="button" variant="outline" onClick={generateSKU} className="shrink-0 border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Barcode (Opsional)</Label>
                    <div className="flex relative">
                      <QrCode className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9 bg-accent/50 focus:bg-background"
                        placeholder="Scan atau ketik barcode" 
                        value={formData.barcode} 
                        onChange={(e) => setFormData({...formData, barcode: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Produk <span className="text-red-500">*</span></Label>
                    <Input 
                      placeholder="Masukkan nama produk" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      className="bg-accent/50 focus:bg-background"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kategori Produk</Label>
                      <Link href="/inventory/categories" className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium">
                        <Edit className="w-3 h-3" /> Kelola Kategori
                      </Link>
                    </div>
                    <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val || ""})}>
                      <SelectTrigger className="w-full bg-accent/50 focus:bg-background">
                        <SelectValue placeholder="Pilih Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <SelectItem value="empty" disabled>Belum ada kategori</SelectItem>
                        ) : (
                          categories.map((c: any, idx: number) => (
                            <SelectItem key={c?.id || idx} value={c?.id || `cat-${idx}`}>{c?.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deskripsi Tambahan</Label>
                  <Input 
                    placeholder="Deskripsi singkat produk (opsional)" 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    className="bg-accent/50 focus:bg-background"
                  />
                </div>
              </div>

              {/* Section 2: Harga */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <div className="w-4 h-4 text-emerald-500 font-bold flex items-center justify-center">Rp</div>
                  <h3 className="font-semibold text-sm text-foreground">Informasi Harga</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Harga Beli Dasar <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-medium">Rp</span>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={formData.purchasePrice} 
                        onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})} 
                        className="pl-9 font-mono"
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Harga Jual (Retail) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-medium">Rp</span>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={formData.sellingPrice} 
                        onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})} 
                        className="pl-9 font-mono border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-900/50"
                        required 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Foto Produk */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-sm text-foreground">Media & Foto</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors bg-accent/20">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={images.length >= 8}
                    />
                    <label htmlFor="image-upload" className={`flex flex-col items-center justify-center gap-3 ${images.length >= 8 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full shadow-sm">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Klik untuk mengunggah foto produk
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Maks 8 foto. PNG, JPG (Otomatis dikompres)</div>
                      </div>
                    </label>
                  </div>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 mt-4">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square shadow-sm">
                          <img 
                            src={URL.createObjectURL(img)} 
                            alt={`Preview ${idx}`} 
                            className="w-full h-full object-cover"
                          />
                          <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1 bg-red-500/90 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="w-24">Batal</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px] shadow-md shadow-indigo-500/20" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
                </Button>
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
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-3 gap-2 outline-none">
                <LayoutGrid className="w-4 h-4" /> Kolom
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.sku}
                  onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, sku: c })}
                >
                  SKU
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.category}
                  onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, category: c })}
                >
                  Kategori
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.price}
                  onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, price: c })}
                >
                  Harga Jual
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.totalStock}
                  onCheckedChange={(c) => setVisibleColumns({ ...visibleColumns, totalStock: c })}
                >
                  Total Stok
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                {visibleColumns.sku && <TableHead className="w-[100px] font-semibold">SKU</TableHead>}
                <TableHead className="font-semibold">Nama Produk</TableHead>
                {visibleColumns.category && <TableHead className="font-semibold">Kategori</TableHead>}
                {visibleColumns.price && <TableHead className="text-right font-semibold">Harga Jual</TableHead>}
                {warehouses.map((wh) => (
                  <TableHead key={wh.id} className="text-center font-semibold bg-indigo-50/50 dark:bg-indigo-900/10 border-l border-r border-indigo-100 dark:border-indigo-900/30">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold tracking-widest mb-1">{wh.name}</span>
                      <span className="text-[10px] text-slate-500">{wh.location || "Cabang"}</span>
                    </div>
                  </TableHead>
                ))}
                {visibleColumns.totalStock && <TableHead className="text-center font-bold">Total Stok</TableHead>}
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
                      {visibleColumns.sku && <TableCell className="font-mono text-xs text-slate-500">{p.sku}</TableCell>}
                      <TableCell className="font-medium text-slate-900 dark:text-white">{p.name}</TableCell>
                      {visibleColumns.category && (
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium rounded-md">
                            {p.category}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.price && <TableCell className="text-right font-medium">{formatIDR(p.price)}</TableCell>}
                      
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
                      {visibleColumns.totalStock && (
                        <TableCell className="text-center">
                          <Badge className={`${
                            totalStock < 50 ? 'bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 border-none' : 
                            'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-none'
                          } font-bold px-2 py-0.5`}>
                            {totalStock}
                          </Badge>
                        </TableCell>
                      )}
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
