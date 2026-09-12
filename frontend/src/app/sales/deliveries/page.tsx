"use client"
import { useEffect, useState } from 'react'
import { B2BApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Search, Filter, ChevronLeft, Truck, CheckCircle2, FileText, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DeliveriesPage() {
 const router = useRouter()
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState("")
 const [selectedDoc, setSelectedDoc] = useState<any | null>(null)
 
 // detail state
 const [docLoading, setDocLoading] = useState(false)
 const [docDetails, setDocDetails] = useState<any | null>(null)

 useEffect(() => {
 fetchDeliveries()
 }, [])

 const fetchDeliveries = async () => {
 try {
 const res = await B2BApi.getDeliveries({ page: 1, limit: 100 })
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
 const res = await B2BApi.getDelivery(doc.id)
 setDocDetails(res)
 } catch(e) {
 console.error(e)
 setDocDetails(doc) // fallback
 } finally {
 setDocLoading(false)
 }
 }

 const handleValidate = async () => {
 if (!selectedDoc) return
 try {
 setDocLoading(true)
 await B2BApi.validateDelivery(selectedDoc.id)
 await fetchDeliveries()
 await viewDetails(selectedDoc)
 } catch (e) {
 console.error(e)
 } finally {
 setDocLoading(false)
 }
 }

 const getStatusBadge = (status: string) => {
 switch (status) {
 case 'DRAFT': return <Badge variant="secondary" className="bg-muted/50 text-foreground">Draft</Badge>
 case 'READY': return <Badge className="bg-indigo-500 hover:bg-indigo-600">Ready</Badge>
 case 'DONE': return <Badge className="">Done</Badge>
 case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>
 default: return <Badge variant="outline">{status}</Badge>
 }
 }

 const filtered = data.filter(item => 
 item.delivery_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
 <h1 className="text-2xl font-bold tracking-tight">{details.delivery_number}</h1>
 {getStatusBadge(details.status)}
 </div>
 <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm">
 <Truck className="h-4 w-4" /> Delivery / Surat Jalan
 </p>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Print SJ</Button>
 
 {(details.status === 'DRAFT' || details.status === 'READY') && (
 <Button onClick={handleValidate} className="">
 <CheckCircle2 className="w-4 h-4 mr-2" /> Validate Delivery
 </Button>
 )}
 </div>
 </div>

 {docLoading && !docDetails ? (
 <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="md:col-span-2 shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4">
 <CardTitle className="text-lg">Delivery Operations</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/30">
 <tr>
 <th className="p-4 text-left font-medium text-muted-foreground">Product</th>
 <th className="p-4 text-center font-medium text-muted-foreground">Demand (Qty)</th>
 <th className="p-4 text-center font-medium text-muted-foreground">Done</th>
 </tr>
 </thead>
 <tbody>
 {(details.lines || []).length === 0 ? (
 <tr><td colSpan={3} className="text-center p-8 text-muted-foreground">No items to deliver.</td></tr>
 ) : (
 details.lines.map((line: any, i: number) => (
 <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
 <td className="p-4">
 <p className="font-medium">{line.product?.name || line.product_id}</p>
 </td>
 <td className="p-4 text-center text-muted-foreground">{line.quantity}</td>
 <td className="p-4 text-center font-medium">{line.delivered_quantity || line.quantity}</td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>

 <Card className="shadow-sm h-fit">
 <CardHeader className="border-b bg-muted/10 pb-4">
 <CardTitle className="text-lg">Shipping Information</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 pt-6">
 <div>
 <p className="text-sm font-medium text-muted-foreground mb-1">Customer</p>
 <p className="font-medium">{details.customer?.name || '-'}</p>
 </div>
 <div>
 <p className="text-sm font-medium text-muted-foreground mb-1">Delivery Address</p>
 <p className="font-medium text-sm">{details.delivery_address || details.customer?.address || 'No address provided'}</p>
 </div>
 <div>
 <p className="text-sm font-medium text-muted-foreground mb-1">Schedule Date</p>
 <p className="font-medium">{new Date(details.scheduled_date || details.createdAt).toLocaleDateString('id-ID')}</p>
 </div>
 {details.order_id && (
 <div>
 <p className="text-sm font-medium text-muted-foreground mb-1">Source Document</p>
 <p className="font-medium text-indigo-600 hover:underline cursor-pointer" onClick={() => router.push("/sales/orders")}>
 View Sales Order
 </p>
 </div>
 )}
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
 <h1 className="text-3xl font-bold tracking-tight">Deliveries</h1>
 <p className="text-muted-foreground mt-1">Manage outbound shipments and delivery orders (Surat Jalan).</p>
 </div>
 <Button className="shadow-sm"><Plus className="w-4 h-4 mr-2" /> New Delivery</Button>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <CardTitle className="text-lg">Delivery Records</CardTitle>
 <div className="flex items-center gap-2">
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input 
 type="search" 
 placeholder="Search delivery..." 
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
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Delivery No</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Customer</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Date</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Status</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Action</th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? (
 <tr><td colSpan={5} className="text-center p-12 text-muted-foreground">No deliveries found.</td></tr>
 ) : filtered.map((item) => (
 <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => viewDetails(item)}>
 <td className="p-4 px-6 font-medium text-indigo-600 dark:text-indigo-400">{item.delivery_number}</td>
 <td className="p-4 px-6 font-medium">{item.customer?.name || '-'}</td>
 <td className="p-4 px-6 text-muted-foreground">{new Date(item.scheduled_date || item.createdAt).toLocaleDateString('id-ID')}</td>
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
