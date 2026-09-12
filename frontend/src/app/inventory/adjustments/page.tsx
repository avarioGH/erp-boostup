"use client"
import { useState, useEffect } from"react"
import { api } from"@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Badge } from"@/components/ui/badge"
import { Input } from"@/components/ui/input"
import { Loader2, Search, SlidersHorizontal, ChevronLeft, CheckCircle2 } from"lucide-react"
import { useToast } from"@/hooks/use-toast"

export default function AdjustmentsPage() {
 const { toast } = useToast()
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [searchTerm, setSearchTerm] = useState("")
 const [selectedDoc, setSelectedDoc] = useState<any | null>(null)
 const [actionLoading, setActionLoading] = useState(false)

 useEffect(() => { fetchAdjustments() }, [])

 const fetchAdjustments = async () => {
 try {
 setLoading(true)
 const res = await api.get('/inventory/transactions')
 setData((Array.isArray(res?.data) ? res.data : []).filter(t => t.type === 'ADJUSTMENT'))
 } catch (err) { console.error(err) } finally { setLoading(false) }
 }

 const validateAdjustment = async (id: string) => {
 setActionLoading(true)
 try {
 await api.post(`/inventory/adjustment/${id}/validate`)
 toast({ title:"Adjustment Validated", description:"Stock levels have been adjusted." })
 setSelectedDoc(null)
 fetchAdjustments()
 } catch (err: any) {
 toast({ title:"Error", description: err.response?.data?.message ||"Failed to validate adjustment.", variant:"destructive" })
 } finally { setActionLoading(false) }
 }

 const filtered = data.filter(item => 
 item.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 item.warehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase())
 )

 if (selectedDoc) {
 return (
 <div className="space-y-6 animate-in fade-in duration-300 pb-10">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <Button variant="outline" size="icon" onClick={() => setSelectedDoc(null)}><ChevronLeft className="h-4 w-4" /></Button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="text-2xl font-bold tracking-tight">{selectedDoc.transaction_number || 'Adjustment'}</h1>
 <Badge variant={selectedDoc.status === 'DONE' ? 'default' : 'secondary'}>{selectedDoc.status || 'PENDING'}</Badge>
 </div>
 <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Stock Adjustment</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {(selectedDoc.status === 'PENDING' || selectedDoc.status === 'DRAFT') && (
 <Button onClick={() => validateAdjustment(selectedDoc.id)} disabled={actionLoading} className="bg-amber-600 hover:bg-amber-700 text-white">
 {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Validate Adjustment
 </Button>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="md:col-span-2 shadow-sm">
 <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Adjusted Items</CardTitle></CardHeader>
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/30"><tr>
 <th className="p-4 text-left font-medium text-muted-foreground">Product</th>
 <th className="p-4 text-center font-medium text-muted-foreground">Quantity Diff</th>
 </tr></thead>
 <tbody>
 {(selectedDoc.items || []).length === 0 ? (
 <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">No items in this adjustment.</td></tr>
 ) : selectedDoc.items.map((item: any, i: number) => (
 <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
 <td className="p-4 font-medium">{item.product?.name || item.product_id}</td>
 <td className={`p-4 text-center font-bold ${item.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
 {item.quantity > 0 ? '+' : ''}{item.quantity || item.qty}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>

 <Card className="shadow-sm h-fit">
 <CardHeader className="border-b bg-muted/10 pb-4"><CardTitle className="text-lg">Adjustment Details</CardTitle></CardHeader>
 <CardContent className="space-y-4 pt-6">
 <div><p className="text-sm font-medium text-muted-foreground mb-1">Warehouse</p><p className="font-medium text-indigo-600">{selectedDoc.warehouse?.name || '-'}</p></div>
 <div><p className="text-sm font-medium text-muted-foreground mb-1">Date</p><p className="font-medium">{new Date(selectedDoc.date || selectedDoc.created_at || Date.now()).toLocaleDateString('id-ID')}</p></div>
 <div><p className="text-sm font-medium text-muted-foreground mb-1">Reason</p><p className="font-medium text-sm">{selectedDoc.notes || '-'}</p></div>
 </CardContent>
 </Card>
 </div>
 </div>
 )
 }

 return (
 <div className="space-y-6 pb-10">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Stock Adjustments</h1>
 <p className="text-muted-foreground mt-1">Manual corrections for discrepancies.</p>
 </div>
 <Button className="shadow-sm">New Adjustment</Button>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <CardTitle className="text-lg">Adjustment Records</CardTitle>
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input type="search" placeholder="Search adjustment, warehouse..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-y"><tr>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Adj No</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Warehouse</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Date</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Reason</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Status</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Action</th>
 </tr></thead>
 <tbody>
 {filtered.length === 0 ? (
 <tr><td colSpan={6} className="text-center p-12 text-muted-foreground">No adjustments found.</td></tr>
 ) : filtered.map((t) => (
 <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => setSelectedDoc(t)}>
 <td className="p-4 px-6 font-medium text-amber-600 dark:text-amber-500">{t.transaction_number || t.id.slice(0,8)}</td>
 <td className="p-4 px-6 text-indigo-600">{t.warehouse?.name || '-'}</td>
 <td className="p-4 px-6 text-muted-foreground">{new Date(t.date || t.created_at || Date.now()).toLocaleDateString('id-ID')}</td>
 <td className="p-4 px-6 text-muted-foreground truncate max-w-[200px]">{t.notes || '-'}</td>
 <td className="p-4 px-6 text-center"><Badge variant={t.status === 'DONE' ? 'default' : 'secondary'}>{t.status || 'PENDING'}</Badge></td>
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
