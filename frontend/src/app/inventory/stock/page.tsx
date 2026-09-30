"use client"
import { useState, useEffect } from"react"
import { api, InventoryAPI } from"@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from"@/components/ui/select"
import { Loader2, Search, Package, Box } from"lucide-react"

export default function StockPage() {
 const [data, setData] = useState<any[]>([])
 const [warehouses, setWarehouses] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState("")
 const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all")

 useEffect(() => {
 Promise.all([
 api.get('/inventory/stocks').then(res => setData(Array.isArray(res.data) ? res.data : [])).catch(console.error),
 InventoryAPI.getWarehouses().then((res: any) => setWarehouses(Array.isArray(res) ? res : [])).catch(console.error)
 ]).finally(() => setLoading(false))
 }, [])

 const filtered = (Array.isArray(data) ? data : []).filter(item => 
 (selectedWarehouse ==="all" || item.warehouse_id === selectedWarehouse) &&
 (item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
 item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
 )

 return (
 <div className="space-y-6 pb-10">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h1 className="text-[28px] font-bold tracking-tight text-foreground">Stok Ikan</h1>
 <p className="text-muted-foreground mt-1">Pantau stok ikan secara real-time di seluruh gudang.</p>
 </div>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4 border-b border-border/40">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <CardTitle className="text-[16px] font-semibold flex items-center gap-2"><Box className="w-5 h-5" /> Stok Tersedia</CardTitle>
 <div className="flex items-center gap-2 w-full sm:w-auto">
 <Select value={selectedWarehouse} onValueChange={(val) => setSelectedWarehouse(val ||"")}>
 <SelectTrigger className="w-[180px]">
 <SelectValue placeholder="Semua Gudang" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">Semua Gudang</SelectItem>
 {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
 </SelectContent>
 </Select>
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input type="search" placeholder="Cari produk atau SKU..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 </div>
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="min-w-[600px] md:min-w-full w-full text-sm">
 <thead className="bg-muted border-y border-border">
 <tr>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Product</th>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">SKU</th>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Warehouse</th>
 <th className="p-4 px-6 text-right text-[#526174] font-semibold text-[13px] tracking-wide">Stok Saat Ini</th>
 <th className="p-4 px-6 text-center text-[#526174] font-semibold text-[13px] tracking-wide">Status</th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? (
 <tr><td colSpan={5} className="text-center p-12 text-muted-foreground">Tidak ada data stok ikan ditemukan.</td></tr>
 ) : filtered.map((s, i) => (
 <tr key={s.id || i} className="border-b last:border-0 hover:bg-muted/20">
 <td className="p-4 px-6 font-medium">{s.product?.name || '-'}<br/><span className="text-[11px] text-muted-foreground font-mono">{s.product?.weight ? s.product.weight + " gr" : ""}</span></td>
 <td className="p-4 px-6 text-muted-foreground">{s.product?.sku || '-'}</td>
 <td className="p-4 px-6 text-muted-foreground">{s.warehouse?.name || '-'}</td>
 <td className="py-3.5 px-6 text-right font-bold text-primary text-[13px]">{s.current_stock}</td>
 <td className="p-4 px-6 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${s.current_stock < 10 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{s.current_stock < 10 ? "Menipis" : "Aman"}</span></td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}

