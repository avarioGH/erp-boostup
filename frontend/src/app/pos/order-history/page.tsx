"use client"

import { useState, useEffect } from "react"
import { 
 Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search, Filter, Receipt, Calendar, User, Clock, ArrowRight, CheckCircle, XCircle, PackageCheck, AlertCircle, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { formatIDR } from "@/lib/utils"
import Link from "next/link"

export default function PosOrderHistoryPage() {
 const [loading, setLoading] = useState(true)
 const [orders, setOrders] = useState<any[]>([])
 const [searchQuery, setSearchQuery] = useState("")
 const [startDate, setStartDate] = useState("")
 const [endDate, setEndDate] = useState("")
 const [statusFilter, setStatusFilter] = useState("ALL")
 const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

 const handleFulfill = async (orderId: string, orderNumber: string) => {
   if (!confirm(`Selesaikan Pesanan PO ${orderNumber}? Stok produk di inventori akan otomatis terpotong.`)) return;
   try {
     setActionLoadingId(orderId);
     await api.post(`/pos/orders/${orderId}/fulfill`);
     toast.success(`Pesanan PO ${orderNumber} berhasil diselesaikan! Stok telah dipotong.`);
     await fetchOrders();
   } catch (err: any) {
     const msg = err?.response?.data?.message || err?.message || "Gagal menyelesaikan PO";
     toast.error(msg);
   } finally {
     setActionLoadingId(null);
   }
 };

 const handleCancel = async (orderId: string, orderNumber: string) => {
   if (!confirm(`Batalkan Pesanan PO ${orderNumber}? Status akan berubah menjadi Dibatalkan.`)) return;
   try {
     setActionLoadingId(orderId);
     await api.post(`/pos/orders/${orderId}/cancel`);
     toast.success(`Pesanan PO ${orderNumber} berhasil dibatalkan.`);
     await fetchOrders();
   } catch (err: any) {
     const msg = err?.response?.data?.message || err?.message || "Gagal membatalkan PO";
     toast.error(msg);
   } finally {
     setActionLoadingId(null);
   }
 };

 useEffect(() => {
 fetchOrders()
 }, [])

 const fetchOrders = async () => {
 try {
 setLoading(true)
 const res = await api.get('/pos/history')
 setOrders(res.data)
 } catch (err) {
 console.error(err)
 } finally {
 setLoading(false)
 }
 }

 const filteredOrders = orders.filter(o => {
   const q = searchQuery.toLowerCase();
   const matchesSearch = !q || 
     (o.order_number || "").toLowerCase().includes(q) ||
     (o.customer?.name || "").toLowerCase().includes(q);

   const matchesStatus = statusFilter === "ALL" ? true :
     statusFilter === "PO" ? o.status === "PREORDER" :
     statusFilter === "COMPLETED" ? o.status === "COMPLETED" :
     statusFilter === "CANCELLED" ? o.status === "CANCELLED" : true;

   const orderDateStr = o.order_date ? new Date(o.order_date).toISOString().split('T')[0] : '';
   let matchesDate = true;
   if (startDate && orderDateStr < startDate) matchesDate = false;
   if (endDate && orderDateStr > endDate) matchesDate = false;

   return matchesSearch && matchesStatus && matchesDate;
 });

 const poCount = orders.filter(o => o.status === "PREORDER").length;

 const handleReset = () => {
   setSearchQuery("");
   setStartDate("");
   setEndDate("");
   setStatusFilter("ALL");
 };

 return (
 <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
 <div className="flex items-center gap-4">
 <Link href="/pos">
 <Button variant="ghost" size="icon" className="rounded-full">
 <ArrowLeft className="w-5 h-5" />
 </Button>
 </Link>
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Riwayat Penjualan</h1>
 <p className="text-[14px] text-muted-foreground mt-1">Pantau seluruh transaksi kasir yang telah berhasil dilakukan.</p>
 </div>
 </div>

 <Card className="border-border shadow-sm overflow-hidden">
 <div className="h-2 w-full bg-blue-500"></div>
 <CardHeader className="pb-4 border-b border-border/60">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
 <div>
 <CardTitle className="flex items-center gap-2">
 <Receipt className="w-5 h-5 text-blue-500" /> Semua Transaksi
 </CardTitle>
 </div>
 
 <div className="flex flex-wrap items-center gap-2">
 <div className="relative w-full sm:w-60">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <Input 
 placeholder="Cari No. Order / Pelanggan..." 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 bg-card border-border h-9 text-xs sm:text-sm"
 />
 </div>
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
   <span>Dari:</span>
   <Input 
     type="date" 
     className="w-auto h-9 text-xs" 
     value={startDate} 
     onChange={(e) => setStartDate(e.target.value)} 
   />
 </div>
 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
   <span>Sampai:</span>
   <Input 
     type="date" 
     className="w-auto h-9 text-xs" 
     value={endDate} 
     onChange={(e) => setEndDate(e.target.value)} 
   />
 </div>
 {(searchQuery || startDate || endDate || statusFilter !== "ALL") && (
   <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground">
     <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
   </Button>
 )}
 </div>
 </div>

 {/* Status Filter Tabs */}
 <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50 overflow-x-auto">
   <Button 
     variant={statusFilter === "ALL" ? "default" : "outline"} 
     size="sm" 
     className="rounded-full text-xs h-7 px-3"
     onClick={() => setStatusFilter("ALL")}
   >
     Semua ({orders.length})
   </Button>
   <Button 
     variant={statusFilter === "PO" ? "default" : "outline"} 
     size="sm" 
     className={`rounded-full text-xs h-7 px-3 gap-1.5 ${statusFilter === "PO" ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-amber-500/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"}`}
     onClick={() => setStatusFilter("PO")}
   >
     <PackageCheck className="w-3.5 h-3.5" />
     Pesanan PO / Pre-Order ({poCount})
   </Button>
   <Button 
     variant={statusFilter === "COMPLETED" ? "default" : "outline"} 
     size="sm" 
     className="rounded-full text-xs h-7 px-3"
     onClick={() => setStatusFilter("COMPLETED")}
   >
     Selesai Lunas
   </Button>
   <Button 
     variant={statusFilter === "CANCELLED" ? "default" : "outline"} 
     size="sm" 
     className="rounded-full text-xs h-7 px-3"
     onClick={() => setStatusFilter("CANCELLED")}
   >
     Dibatalkan
   </Button>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="py-20 text-center text-muted-foreground">Memuat riwayat transaksi...</div>
 ) : filteredOrders.length === 0 ? (
 <div className="py-20 text-center text-muted-foreground">Tidak ada transaksi yang cocok.</div>
 ) : (
 <div className="divide-y divide-slate-100 dark:divide-slate-800">
 {filteredOrders.map((order) => (
 <div key={order.id} className="p-4 sm:p-6 hover:bg-muted/30 dark:hover:bg-slate-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <span className="font-bold text-foreground dark:text-white">{order.order_number}</span>
 <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
 order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
 order.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
 order.status === 'PREORDER' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse' :
 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
 }`}>
 {order.status === 'PREORDER' ? 'PRE-ORDER (PO)' : order.status}
 </span>
 </div>
 
 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
 <div className="flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5" />
 <span>{new Date(order.order_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5" />
 <span>{new Date(order.order_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <User className="w-3.5 h-3.5" />
 <span>{order.customer?.name || "Pelanggan Umum"}</span>
 </div>
 </div>
 </div>
 
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:justify-end">
 <div className="text-left sm:text-right">
 <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total</div>
 <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
 {formatIDR(order.total_amount)}
 </div>
 </div>

 {order.status === 'PREORDER' && (
   <div className="flex items-center gap-2">
     <Button
       size="sm"
       className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm"
       disabled={actionLoadingId === order.id}
       onClick={() => handleFulfill(order.id, order.order_number)}
     >
       <CheckCircle className="w-3.5 h-3.5" />
       {actionLoadingId === order.id ? "Memproses..." : "Selesaikan PO"}
     </Button>
     <Button
       variant="outline"
       size="sm"
       className="h-8 text-xs font-bold border-rose-300 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1"
       disabled={actionLoadingId === order.id}
       onClick={() => handleCancel(order.id, order.order_number)}
     >
       <XCircle className="w-3.5 h-3.5" />
       Batalkan
     </Button>
   </div>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}
