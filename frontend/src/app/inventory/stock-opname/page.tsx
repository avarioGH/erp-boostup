"use client"
import { useState, useEffect } from "react"
import { api, InventoryAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, ClipboardCheck, ChevronLeft, CheckCircle2, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StockOpnamePage() {
 const { toast } = useToast()
 const [data, setData] = useState<any[]>([])
 const [warehouses, setWarehouses] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [actionLoading, setActionLoading] = useState(false)
 const [selectedWarehouse, setSelectedWarehouse] = useState<string>("")

 useEffect(() => { 
 fetchData()
 InventoryAPI.getWarehouses().then((res: any) => setWarehouses(Array.isArray(res) ? res : [])).catch(console.error)
 }, [])

 const fetchData = async () => {
 try {
 setLoading(true)
 const res = await api.get('/inventory/transactions')
 setData((Array.isArray(res?.data) ? res.data : []).filter(t => t.type === 'OPNAME'))
 } catch (err) { console.error(err) } finally { setLoading(false) }
 }

 const startOpname = async () => {
 if (!selectedWarehouse) return toast({ title: "Required", description: "Please select a warehouse.", variant: "destructive" })
 setActionLoading(true)
 try {
 await api.post(`/inventory/stock-opname`, { warehouseId: selectedWarehouse })
 toast({ title: "Opname Started", description: "Stock opname session has been created." })
 setSelectedWarehouse("")
 fetchData()
 } catch (err: any) {
 toast({ title: "Error", description: err.response?.data?.message || "Failed to start opname.", variant: "destructive" })
 } finally { setActionLoading(false) }
 }

 return (
 <div className="space-y-6 pb-10">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight">Stock Opname</h1>
 <p className="text-muted-foreground mt-1">Physical stock counting and reconciliation.</p>
 </div>
 </div>

 <Card className="shadow-sm border-purple-200">
 <CardHeader className="bg-purple-50/50 border-b pb-4">
 <CardTitle className="text-lg flex items-center gap-2 text-purple-800"><Play className="w-5 h-5" /> Start New Opname</CardTitle>
 </CardHeader>
 <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 items-end">
 <div className="w-full sm:w-1/2 space-y-2">
 <label className="text-sm font-medium">Select Warehouse</label>
 <Select value={selectedWarehouse} onValueChange={(val) => setSelectedWarehouse(val || "")}>
 <SelectTrigger>
 <SelectValue placeholder="Select warehouse to count..." />
 </SelectTrigger>
 <SelectContent>
 {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <Button onClick={startOpname} disabled={actionLoading || !selectedWarehouse} className="bg-purple-600 hover:bg-purple-700">
 {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ClipboardCheck className="w-4 h-4 mr-2" />} Create Session
 </Button>
 </CardContent>
 </Card>

 <Card className="shadow-sm">
 <CardHeader className="pb-4">
 <CardTitle className="text-lg">Opname History</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? (
 <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-muted/50 border-y"><tr>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Opname No</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Warehouse</th>
 <th className="p-4 px-6 text-left font-medium text-muted-foreground">Date</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Status</th>
 <th className="p-4 px-6 text-center font-medium text-muted-foreground">Action</th>
 </tr></thead>
 <tbody>
 {data.length === 0 ? (
 <tr><td colSpan={5} className="text-center p-12 text-muted-foreground">No opname sessions found.</td></tr>
 ) : data.map((t) => (
 <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
 <td className="p-4 px-6 font-medium text-purple-600">{t.transaction_number || t.id.slice(0,8)}</td>
 <td className="p-4 px-6 font-medium">{t.warehouse?.name || '-'}</td>
 <td className="p-4 px-6 text-muted-foreground">{new Date(t.date || t.created_at || Date.now()).toLocaleDateString('id-ID')}</td>
 <td className="p-4 px-6 text-center"><Badge variant={t.status === 'DONE' ? 'default' : 'secondary'}>{t.status || 'PENDING'}</Badge></td>
 <td className="p-4 px-6 text-center"><Button variant="ghost" size="sm">Review</Button></td>
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
