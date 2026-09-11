"use client"
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PurchasingAPI } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Filter, ChevronLeft, CheckCircle2, Truck, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

function GoodsReceiptContent() {
 const router = useRouter()
 const { toast } = useToast()
 const searchParams = useSearchParams()
 const poIdParam = searchParams.get('po')

 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState("")
 const [selectedDoc, setSelectedDoc] = useState<any | null>(null)
 const [docLoading, setDocLoading] = useState(false)
 const [docDetails, setDocDetails] = useState<any | null>(null)

 useEffect(() => { fetchReceipts() }, [])

 const fetchReceipts = async () => {
 try {
 setLoading(true)
 const res = await PurchasingAPI.getReceipts()
 setData(res?.data || [])
 } catch (err) { console.error(err) } finally { setLoading(false) }
 }

 const viewDetails = async (doc: any) => {
 setSelectedDoc(doc)
 setDocLoading(true)
 try {
 const res = await PurchasingAPI.getReceipt(doc.id)
 setDocDetails(res)
 } catch(e) { console.error(e); setDocDetails(doc) } finally { setDocLoading(false) }
 }

 const getStatusBadge = (status: string) => {
 switch(status) {
 case 'DRAFT': return <Badge variant="secondary" className="bg-muted/50 text-foreground">Draft</Badge>
 case 'DONE': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Validated</Badge>
 case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>
 default: return <Badge variant="outline">{status || 'Received'}</Badge>
 }
 }

 const filtered = data.filter(item =>
 item.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.purchase_order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
 )

 if (selectedDoc) {
 const details = docDetails || selectedDoc
 return (
 <div className="space-y-6 animate-in fade-in duration-300 pb-10">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <Button variant="outline" size="icon" onClick={() => setSelectedDoc(null)}><ChevronLeft className="h-4 w-4" /></Button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-2xl font-bold tracking-tight">{details.receipt_number}</h1>
 {getStatusBadge(details.status)}
 </div>
 <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> Goods Receipt</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {details.purchase_order?.id && (
 <Button variant="outline" onClick={() => router.push('/purchasing/orders')}>
 View Purchase Order
 </Button>
 )}
 <Button variant="outline" onClick={() => router.push('/finance/vendor-bills')} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
 Create Vendor Bill
 </Button>
 </div>
 </div>

 {docLoading && !docDetails ? (
 <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="md:col-span-2 shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Received Items</CardTitle></CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/30"><tr>
 <th className="p-4 text-left font-medium text-muted-foreground">Product</th>
 <th className="p-4 text-center font-medium text-muted-foreground">Ordered</th>
 <th className="p-4 text-center font-medium text-muted-foreground">Previously Received</th>
 <th className="p-4 text-center font-medium text-muted-foreground">This Receipt</th>
 </tr></thead>
 <tbody>
 {(details.items || []).length === 0 ? (
 <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No items in this receipt.</td></tr>
 ) : details.items.map((item: any, i: number) => (
 <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
 <td className="p-4 font-medium">{item.product?.name || item.product_id}</td>
 <td className="p-4 text-center text-muted-foreground">{item.ordered_qty || item.qty || '-'}</td>
 <td className="p-4 text-center text-muted-foreground">{item.previously_received_qty || 0}</td>
 <td className="p-4 text-center font-bold text-indigo-600">{item.received_qty || item.qty}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>

 <Card className="shadow-sm h-fit">
 <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Receipt Information</CardTitle></CardHeader>
 <CardContent className="space-y-4 pt-6">
 <div><p className="text-sm font-medium text-muted-foreground mb-1">Supplier</p><p className="font-medium">{details.supplier?.name || '-'}</p></div>
 <div><p className="text-sm font-medium text-muted-foreground mb-1">Purchase Order</p>
 <p className="font-medium text-indigo-600 cursor-pointer hover:underline" onClick={() => router.push('/purchasing/orders')}>
 {details.purchase_order?.order_number || '-'}
 </p>
 </div>
 <div><p className="text-sm font-medium text-muted-foreground mb-1">Receipt Date</p><p className="font-medium">{new Date(details.receipt_date || details.createdAt || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
 <div className="pt-4 border-t">
 <p className="text-xs text-muted-foreground">Inventory is updated automatically by the backend when a receipt is validated.</p>
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
 <h1 className="text-3xl font-bold tracking-tight">Goods Receipts</h1>
 <p className="text-muted-foreground mt-1">Track incoming goods from suppliers. Validated receipts update inventory automatically.</p>
 </div>
 </div>

 {poIdParam && (
 <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-800 shadow-sm">
 <CardContent className="pt-4 flex items-center gap-3">
 <Package className="h-5 w-5 text-indigo-600" />
 <div>
 <p className="font-medium text-indigo-800 dark:text-indigo-300">Receiving goods for Purchase Order</p>
 <p className="text-sm text-indigo-600 dark:text-indigo-400">PO ID: {poIdParam} — Create a new receipt below or validate an existing draft.</p>
 </div>
 </CardContent>
 </Card>
 )}

 <Card className="shadow-sm">
 <CardHeader className="pb-4">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <CardTitle className="text-lg">Receipt Records</CardTitle>
 <div className="flex items-center gap-2">
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input type="search" placeholder="Search receipts..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 </div>
 <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? <div className="flex p-12 justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div> : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-y"><tr>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Receipt No</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Purchase Order</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Supplier</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Date</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Status</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Action</th>
 </tr></thead>
 <tbody>
 {filtered.length === 0 ? (
 <tr><td colSpan={6} className="text-center p-12 text-muted-foreground">No goods receipts found.</td></tr>
 ) : filtered.map((item) => (
 <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => viewDetails(item)}>
 <td className="p-4 px-6 font-medium text-indigo-600 dark:text-indigo-400">{item.receipt_number}</td>
 <td className="p-4 px-6 font-medium">{item.purchase_order?.order_number || '-'}</td>
 <td className="p-4 px-6">{item.supplier?.name || '-'}</td>
 <td className="p-4 px-6 text-muted-foreground">{new Date(item.receipt_date || item.createdAt || Date.now()).toLocaleDateString('id-ID')}</td>
 <td className="p-4 px-6 text-center">{getStatusBadge(item.status)}</td>
 <td className="p-4 px-6 text-center"><Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">View</Button></td>
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

export default function GoodsReceiptPage() {
 return (
 <Suspense fallback={<div className="flex p-12 justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>}>
 <GoodsReceiptContent />
 </Suspense>
 )
}
