"use client"
import { useEffect, useState } from 'react'
import { B2BApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Search, Filter, ChevronLeft, Send, CheckCircle2, FileText, Download, Truck, FileOutput } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SalesOrdersPage() {
 const router = useRouter()
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState("")
 const [selectedDoc, setSelectedDoc] = useState<any | null>(null)
 
 // detail state
 const [docLoading, setDocLoading] = useState(false)
 const [docDetails, setDocDetails] = useState<any | null>(null)

 useEffect(() => {
 fetchOrders()
 }, [])

 const fetchOrders = async () => {
 try {
 const res = await B2BApi.getOrders({ page: 1, limit: 100 })
 setData(res?.data || [])
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
 const res = await B2BApi.getOrder(doc.id)
 setDocDetails(res)
 } catch(e) {
 console.error(e)
 setDocDetails(doc) // fallback
 } finally {
 setDocLoading(false)
 }
 }

 const getStatusBadge = (status: string) => {
 switch (status) {
 case 'PENDING': return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300">Pending</Badge>
 case 'CONFIRMED': return <Badge className="bg-indigo-500 hover:bg-indigo-600">Confirmed</Badge>
 case 'DELIVERED': return <Badge className="">Delivered</Badge>
 case 'INVOICED': return <Badge variant="outline" className="border-emerald-500 text-emerald-600">Invoiced</Badge>
 case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>
 default: return <Badge variant="outline">{status}</Badge>
 }
 }

 const filtered = data.filter(item => 
 item.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
 <h1 className="text-2xl font-bold tracking-tight">{details.order_number}</h1>
 {getStatusBadge(details.status)}
 </div>
 <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm">
 <FileText className="h-4 w-4" /> Sales Order Document
 </p>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
 
 {details.status === 'CONFIRMED' && (
 <Button onClick={() => router.push("/sales/deliveries")} className="">
 <Truck className="w-4 h-4 mr-2" /> Create Delivery
 </Button>
 )}
 
 {(details.status === 'CONFIRMED' || details.status === 'DELIVERED') && (
 <Button onClick={() => router.push("/finance/invoices")} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
 <FileOutput className="w-4 h-4 mr-2" /> Create Invoice
 </Button>
 )}
 </div>
 </div>

 {/* Workflow Ribbon UX */}
 <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-lg overflow-x-auto text-sm font-medium">
 <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${details.quotation_id ? 'bg-emerald-100 text-emerald-700' : 'text-muted-foreground'}`}>
 <CheckCircle2 className="w-4 h-4" /> Quotation
 </div>
 <div className="h-px bg-border flex-1 mx-2 min-w-[20px]"></div>
 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
 <CheckCircle2 className="w-4 h-4" /> Sales Order
 </div>
 <div className="h-px bg-border flex-1 mx-2 min-w-[20px]"></div>
 <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${details.status === 'DELIVERED' || details.status === 'INVOICED' ? 'bg-emerald-100 text-emerald-700' : 'text-muted-foreground'}`}>
 <Truck className="w-4 h-4" /> Delivery
 </div>
 <div className="h-px bg-border flex-1 mx-2 min-w-[20px]"></div>
 <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${details.status === 'INVOICED' ? 'bg-emerald-100 text-emerald-700' : 'text-muted-foreground'}`}>
 <FileOutput className="w-4 h-4" /> Invoice
 </div>
 </div>

 {docLoading && !docDetails ? (
 <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="md:col-span-2 shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4">
 <CardTitle className="text-lg">Order Lines</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/30">
 <tr>
 <th className="p-4 text-left font-medium text-muted-foreground">Product</th>
 <th className="p-4 text-center font-medium text-muted-foreground">Ordered</th>
 <th className="p-4 text-center font-medium text-muted-foreground">Delivered</th>
 <th className="p-4 text-right font-medium text-muted-foreground">Unit Price</th>
 <th className="p-4 text-right font-medium text-muted-foreground">Subtotal</th>
 </tr>
 </thead>
 <tbody>
 {(details.lines || []).length === 0 ? (
 <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">No lines available.</td></tr>
 ) : (
 details.lines.map((line: any, i: number) => (
 <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
 <td className="p-4">
 <p className="font-medium">{line.product?.name || line.product_id}</p>
 {line.description && <p className="text-xs text-muted-foreground mt-0.5">{line.description}</p>}
 </td>
 <td className="p-4 text-center font-medium">{line.quantity}</td>
 <td className="p-4 text-center text-muted-foreground">{line.delivered_quantity || 0}</td>
 <td className="p-4 text-right">Rp {Number(line.unit_price || 0).toLocaleString('id-ID')}</td>
 <td className="p-4 text-right font-medium">Rp {Number(line.subtotal || (line.quantity * line.unit_price) || 0).toLocaleString('id-ID')}</td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 
 <div className="border-t bg-muted/10 p-6 flex flex-col items-end space-y-2">
 <div className="flex justify-between w-full sm:w-64 text-base font-bold pt-2">
 <span>Grand Total</span>
 <span>Rp {Number(details.total_amount || 0).toLocaleString('id-ID')}</span>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card className="shadow-sm h-fit">
 <CardHeader className="border-b bg-muted/10 pb-4">
 <CardTitle className="text-lg">Order Information</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 pt-6">
 <div>
 <p className="text-sm font-medium text-muted-foreground mb-1">Customer</p>
 <p className="font-medium">{details.customer?.name || '-'}</p>
 <p className="text-sm text-muted-foreground">{details.customer?.email || ''}</p>
 </div>
 <div>
 <p className="text-sm font-medium text-muted-foreground mb-1">Order Date</p>
 <p className="font-medium">{new Date(details.order_date || details.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
 </div>
 {details.quotation_id && (
 <div>
 <p className="text-sm font-medium text-muted-foreground mb-1">Source Document</p>
 <p className="font-medium text-indigo-600 hover:underline cursor-pointer" onClick={() => router.push("/sales/quotations")}>
 View Quotation
 </p>
 </div>
 )}
 <div className="pt-4 border-t">
 <Button className="w-full" variant="outline" onClick={() => router.push("/crm/customers")}>View Customer 360</Button>
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
 <h1 className="text-3xl font-bold tracking-tight">Sales Orders</h1>
 <p className="text-muted-foreground mt-1">Manage confirmed orders and process fulfillments.</p>
 </div>
 <Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> New Order</Button>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <CardTitle className="text-lg">Sales Orders</CardTitle>
 <div className="flex items-center gap-2">
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input 
 type="search" 
 placeholder="Search order..." 
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
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-y">
 <tr>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Order Number</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Customer</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Date</th>
 <th className="p-4 px-6 text-right font-medium text-muted-foreground">Total</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Status</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Action</th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? (
 <tr><td colSpan={6} className="text-center p-12 text-muted-foreground">No sales orders found.</td></tr>
 ) : filtered.map((item) => (
 <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => viewDetails(item)}>
 <td className="p-4 px-6 font-medium text-indigo-600 dark:text-indigo-400">{item.order_number}</td>
 <td className="p-4 px-6 font-medium">{item.customer?.name || '-'}</td>
 <td className="p-4 px-6 text-muted-foreground">{new Date(item.order_date || item.createdAt).toLocaleDateString('id-ID')}</td>
 <td className="p-4 px-6 text-right font-medium">Rp {Number(item.total_amount || 0).toLocaleString('id-ID')}</td>
 <td className="p-4 px-6 text-center">{getStatusBadge(item.status)}</td>
 <td className="p-4 px-6 text-center">
 <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
 View
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
