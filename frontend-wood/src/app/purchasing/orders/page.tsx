"use client"
import { useEffect, useState } from 'react'
import { api, PurchasingAPI, FinanceAPI } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Search, Filter, ChevronLeft, Send, CheckCircle2, FileText, Download, Truck, FileOutput } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PurchaseOrdersPage() {
 const router = useRouter()
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState("")
 const [selectedDoc, setSelectedDoc] = useState<any | null>(null)
 const [isKayu, setIsKayu] = useState(false)
 
 // detail state
 const [docLoading, setDocLoading] = useState(false)
  const searchParams = useSearchParams()
  const poId = searchParams.get('id')
  
  useEffect(() => {
    if (poId && data.length > 0) {
      const doc = data.find((d: any) => d.id === poId)
      if (doc && !selectedDoc) {
        viewDetails(doc)
      }
    }
  }, [poId, data])
 const [docDetails, setDocDetails] = useState<any | null>(null)

 useEffect(() => {
   if (typeof window !== 'undefined') {
     const stored = localStorage.getItem("erp_user")
     if (stored) {
       try {
         const u = JSON.parse(stored)
         if (u?.name?.toLowerCase().includes('kayu')) setIsKayu(true)
       } catch(e) {}
     }
   }
   fetchOrders()
 }, [])

 const fetchOrders = async () => {
 try {
   const res = await api.get('/purchasing/orders', { params: { page: 1, limit: 100 } })
   const allOrders = res?.data?.data || res?.data || []
   if (Array.isArray(allOrders)) {
     setData(allOrders.filter((o: any) => o.status !== 'DRAFT')) 
   } else {
     setData([])
   }
 } catch (error) {
   console.error(error)
 } finally {
   setLoading(false)
 }
 }

 const viewDetails = async (doc: any) => {
 setSelectedDoc(doc)
 setDocLoading(true)
 try {
 const res = await api.get(`/purchasing/orders/${doc.id}`)
 setDocDetails(res.data || res)
 } catch(e) {
 console.error(e)
 setDocDetails(doc) // fallback
 } finally {
 setDocLoading(false)
 }
 }

 const createVendorBill = async () => {
 if (!selectedDoc) return
 try {
 setDocLoading(true)
 await FinanceAPI.createVendorBill(selectedDoc.id)
 await fetchOrders()
 router.push("/finance/vendor-bills")
 } catch (e: any) {
 alert(e.response?.data?.message ||"Failed to create vendor bill.")
 } finally {
 setDocLoading(false)
 }
 }

 const getStatusBadge = (status: string) => {
 switch (status) {
 case 'DRAFT': return <Badge variant="secondary" className="bg-muted/50 text-foreground">Draft (RFQ)</Badge>
 case 'CONFIRMED': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent">Confirmed</Badge>
 case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>
 default: return <Badge variant="outline">{status}</Badge>
 }
 }

 const getReceiptBadge = (status: string) => {
 switch(status) {
 case 'PENDING': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent">Menunggu Barang</Badge>
 case 'PARTIAL': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-transparent">Diterima Sebagian</Badge>
 case 'RECEIVED': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent">Diterima Penuh</Badge>
 default: return null
 }
 }

 const getPaymentBadge = (status: string) => {
  switch(status) {
    case 'UNPAID': return <Badge variant="secondary" className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-transparent">Belum Dibayar</Badge>;
    case 'PARTIAL': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent">Dibayar Sebagian</Badge>;
    case 'PAID': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent">Lunas</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

const getBillBadge = (status: string) => {
 switch(status) {
 case 'PENDING': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-transparent">Belum Ditagih</Badge>
 case 'BILLED': return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-transparent">Ditagih</Badge>
 default: return null
 }
 }

 const filtered = (Array.isArray(data) ? data : []).filter(item => 
 item.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
 )

 if (selectedDoc) {
 const details = docDetails || selectedDoc
 return (
 <div className="space-y-6 animate-in fade-in duration-300 pb-10">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <Button variant="outline" size="icon" onClick={() => setSelectedDoc(null)}>
 <ChevronLeft className="h-4 w-4" />
 </Button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-[28px] font-bold tracking-tight text-foreground">{details.order_number}</h1>
 {getStatusBadge(details.status)}
 </div>
 <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm">
 <FileText className="h-4 w-4" /> Purchase Order
 </p>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <Button variant="outline" onClick={() => {
        const token = localStorage.getItem("erp_token");
        window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/documents/purchase-orders/${details.id}/pdf?token=${token}`, "_blank");
      }}><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
 
 {details.status === 'CONFIRMED' && details.receipt_status !== 'RECEIVED' && (
 <Button onClick={() => router.push(`/purchasing/receipts?po=${details.id}`)} className="">
 <Truck className="w-4 h-4 mr-2" /> Terima Barang
 </Button>
 )}
 
 {details.status === 'CONFIRMED' && details.receipt_status !== 'PENDING' && details.bill_status !== 'BILLED' && (
 <Button onClick={createVendorBill} variant="outline" className="border-emerald-200 text-primary hover:bg-emerald-50">
 <FileOutput className="w-4 h-4 mr-2" /> Buat Tagihan Vendor
 </Button>
 )}

 {details.bill_status === 'BILLED' && (
 <Button onClick={() => router.push("/finance/vendor-bills")} variant="outline" className="border-border text-foreground hover:bg-muted/30">
 <FileText className="w-4 h-4 mr-2" /> Lihat Tagihan
 </Button>
 )}
 </div>
 </div>

 {/* Workflow Ribbon UX */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 p-4 bg-muted/30 border rounded-lg overflow-x-auto text-sm font-medium">
 <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-primary dark:bg-emerald-900/50 dark:text-emerald-300`}>
 <CheckCircle2 className="w-4 h-4" /> Request / RFQ
 </div>
 <div className="h-px bg-border flex-1 mx-2 min-w-[20px]"></div>
 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-primary dark:bg-indigo-900/50 dark:text-primary">
 <CheckCircle2 className="w-4 h-4" /> Purchase Order
 </div>
 <div className="h-px bg-border flex-1 mx-2 min-w-[20px]"></div>
 <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${details.receipt_status === 'RECEIVED' || details.receipt_status === 'PARTIAL' ? 'bg-emerald-100 text-primary' : 'text-muted-foreground'}`}>
 <Truck className="w-4 h-4" /> Receipt
 </div>
 <div className="h-px bg-border flex-1 mx-2 min-w-[20px]"></div>
 <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${details.bill_status === 'BILLED' ? 'bg-emerald-100 text-primary' : 'text-muted-foreground'}`}>
 <FileOutput className="w-4 h-4" /> Vendor Bill
 </div>
 </div>

 {docLoading && !docDetails ? (
 <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="md:col-span-2 shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4">
 <CardTitle className="text-[16px] font-semibold">Rincian Pesanan (Three-Way Match)</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <table className="min-w-[600px] md:min-w-full w-full text-sm">
 <thead className="bg-muted/30">
 <tr>
 <th className="p-4 text-left font-medium text-muted-foreground">Produk</th>
 <th className="p-4 text-center font-medium text-muted-foreground">Dipesan</th>
 <th className="p-4 text-center font-medium text-muted-foreground">Diterima</th>
 <th className="p-4 text-center font-medium text-muted-foreground">Ditagih</th>
 <th className="p-4 text-right font-medium text-muted-foreground">Unit Price</th>
 <th className="p-4 text-right font-medium text-muted-foreground">Subtotal</th>
 </tr>
 </thead>
 <tbody>
 {(details.items || []).length === 0 ? (
 <tr><td colSpan={6} className="text-center p-4 md:p-8 text-muted-foreground">Tidak ada rincian barang.</td></tr>
 ) : (
 details.items.map((line: any, i: number) => (
 <tr key={i} className="border-b last:border-0 hover:bg-muted/60 transition-colors">
 <td className="p-4">
 <p className="font-medium">{line.product?.name || line.product_id}</p>
 </td>
 <td className="p-4 text-center font-medium">{line.qty}</td>
 <td className="p-4 text-center text-primary font-medium">{line.received_qty || 0}</td>
 <td className="p-4 text-center text-primary font-medium">{line.billed_qty || 0}</td>
 <td className="p-4 text-right">Rp {Number(line.unit_price || 0).toLocaleString('id-ID')}</td>
 <td className="p-4 text-right font-medium">Rp {Number(line.subtotal || (line.qty * line.unit_price) || 0).toLocaleString('id-ID')}</td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 
 <div className="border-t bg-muted/10 p-6 flex flex-col items-end space-y-2">
 <div className="flex justify-between w-full sm:w-64 text-base font-bold pt-2">
 <span>Total Akhir</span>
 <span>Rp {Number(details.total_amount || 0).toLocaleString('id-ID')}</span>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card className="shadow-sm h-fit">
 <CardHeader className="border-b bg-muted/10 pb-4">
 <CardTitle className="text-[16px] font-semibold">Informasi Pembelian</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 pt-6">
 <div>
 <p className="text-sm font-medium text-muted-foreground mb-1">Supplier</p>
 <p className="font-medium">{details.supplier?.name || '-'}</p>
 <p className="text-sm text-muted-foreground">{details.supplier?.email || ''}</p>
 </div>
 <div>
 <p className="text-sm font-medium text-muted-foreground mb-1">Tanggal Order</p>
 <p className="font-medium">{new Date(details.order_date || details.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
 </div>
 <div>
 <p className="text-sm font-medium text-muted-foreground mb-1">Estimasi Diterima</p>
 <p className="font-medium">{details.expected_receipt ? new Date(details.expected_receipt).toLocaleDateString('id-ID') : '-'}</p>
 </div>
 
 <div className="pt-4 border-t space-y-2">
 <div className="flex justify-between items-center text-sm">
 <span className="text-muted-foreground">Status Penerimaan:</span>
 {getReceiptBadge(details.receipt_status)}
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-muted-foreground">Status Tagihan:</span>
 {getBillBadge(details.bill_status)}
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-muted-foreground">Status Pembayaran:</span>
 {getPaymentBadge(details.payment_status)}
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 )}
 </div>
 )
 }

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h1 className="text-[28px] font-bold tracking-tight text-foreground">Order Pembelian</h1>
 <p className="text-muted-foreground mt-1">Kelola pesanan pembelian dan lacak penerimaan barang.</p>
 </div>
 <Button className="shadow-sm" onClick={() => router.push(isKayu ? "/purchasing/orders/create" : "/inventory/purchase-fish/create")}><Plus className="w-4 h-4 mr-2" /> Order Baru</Button>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4 border-b border-border/40">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <CardTitle className="text-[16px] font-semibold">Data Order Pembelian</CardTitle>
 <div className="flex items-center gap-2">
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input 
 type="search" 
 placeholder="Cari PO atau Supplier..." 
 className="pl-8" 
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 <Button variant="outline" size="icon">
 <Filter className="h-4 w-4" />
 </Button>
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="flex p-12 justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="min-w-[600px] md:min-w-full w-full text-sm">
 <thead className="bg-muted border-y border-border">
 <tr>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">No. Order</th>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Supplier</th>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Tanggal</th>
 <th className="p-4 px-6 text-right text-[#526174] font-semibold text-[13px] tracking-wide">Total</th>
 <th className="p-4 px-6 text-center text-[#526174] font-semibold text-[13px] tracking-wide">Penerimaan</th>
 <th className="p-4 px-6 text-center text-[#526174] font-semibold text-[13px] tracking-wide">Tagihan</th>
 <th className="p-4 px-6 text-center text-[#526174] font-semibold text-[13px] tracking-wide">Aksi</th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? (
 <tr><td colSpan={7} className="text-center p-12 text-muted-foreground">Tidak ada order pembelian ditemukan.</td></tr>
 ) : filtered.map((item) => (
 <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => viewDetails(item)}>
 <td className="py-3.5 px-6 font-semibold text-primary text-[13px] dark:text-primary">{item.order_number}</td>
 <td className="p-4 px-6 font-medium">{item.supplier?.name || '-'}</td>
 <td className="p-4 px-6 text-muted-foreground">{new Date(item.order_date || item.createdAt).toLocaleDateString('id-ID')}</td>
 <td className="p-4 px-6 text-right font-medium">Rp {Number(item.total_amount || 0).toLocaleString('id-ID')}</td>
 <td className="py-3.5 px-6 text-center text-[13px]">{getReceiptBadge(item.receipt_status)}</td>
 <td className="py-3.5 px-6 text-center text-[13px]">{getBillBadge(item.bill_status)}</td>
 <td className="py-3.5 px-6 text-center text-[13px]">
 <Button variant="ghost" size="sm" className="bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
 Lihat
  </Button>
 </td>
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

