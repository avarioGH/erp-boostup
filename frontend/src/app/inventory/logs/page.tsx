"use client"
import { useState, useEffect } from"react"
import { TimberAPI } from"@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card"
import { Button } from"@/components/ui/button"
import { Input } from"@/components/ui/input"
import { Badge } from"@/components/ui/badge"
import { Loader2, Plus, Search, ChevronRight, Package, MoreHorizontal, Pencil, Trash, Eye } from"lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from"next/navigation"

export default function RawLogsPage() {
 const router = useRouter()
 const { toast } = useToast()
 const [data, setData] = useState<any[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("");
 const [dateFilter, setDateFilter] = useState("");

 useEffect(() => { fetchLogs() }, [])

 const fetchLogs = async () => {
 setLoading(true)
 try {
 let locationId = undefined;
 if (typeof window !== 'undefined') {
 const stored = localStorage.getItem('active_warehouse');
 if (stored && stored !== 'null' && stored !== 'undefined') {
 const wh = JSON.parse(stored);
 if (wh?.id) locationId = wh.id;
 }
 }
 const res = await TimberAPI.getRawLogs({ locationId })
 setData(res.items || [])
 } catch (e) {
 console.error(e)
 } finally {
 setLoading(false)
 }
 }

 
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      await TimberAPI.deleteLog(id);
      toast({ title: 'Success', description: 'Log deleted.' });
      fetchLogs();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete log', variant: 'destructive' });
    }
  }

 const filtered = data.filter(item => {
 const matchSearch = item.logNumber?.toLowerCase().includes(search.toLowerCase()) || 
 item.barcode?.toLowerCase().includes(search.toLowerCase()) ||
 item.batch?.toLowerCase().includes(search.toLowerCase());
 const itemDate = item.receivingDate || item.createdAt || item.created_at;
 const matchDate = dateFilter && itemDate ? new Date(itemDate).toISOString().split('T')[0] === dateFilter : true;
 return matchSearch && matchDate;
})

 const getStatusBadge = (s: string) => {
 switch (s) {
 case 'AVAILABLE': return <Badge className="bg-emerald-500">AVAILABLE</Badge>
 case 'IN_TRIMMING': return <Badge className="bg-amber-500">IN TRIMMING</Badge>
 case 'CANCELLED': return <Badge variant="destructive">CANCELLED</Badge>
 default: return <Badge variant="secondary">{s}</Badge>
 }
 }

 return (
 <div className="space-y-6 pb-10">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <div>
 <h1 className="text-[28px] font-bold tracking-tight text-foreground">Raw Logs (DUKB)</h1>
 <p className="text-muted-foreground mt-1">Master registry of individual raw timber logs.</p>
 </div>
 <Button onClick={() => router.push('/inventory/logs/create')} className="">
 <Plus className="w-4 h-4 mr-2" /> Register Raw Log
 </Button>
 </div>

 <Card className="shadow-sm">
 <CardHeader className="pb-4 border-b border-border/40">
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
 <CardTitle className="text-[16px] font-semibold">Log Inventory</CardTitle>
 <div className="relative w-full sm:w-64">
 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
 <Input type="search" placeholder="Search log no, barcode..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
 </div>
 <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full sm:w-[150px]" />
 </div>
 </CardHeader>
 <CardContent className="p-0">
 {loading ? <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : (
 <div className="overflow-x-auto">
 <table className="min-w-[600px] md:min-w-full w-full text-sm">
 <thead className="bg-muted border-y border-border">
 <tr>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Date</th>
<th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Log No</th>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Species</th>
 <th className="p-4 px-6 text-left text-[#526174] font-semibold text-[13px] tracking-wide">Partai</th>
 <th className="p-4 px-6 text-right text-[#526174] font-semibold text-[13px] tracking-wide">Length</th>
 <th className="p-4 px-6 text-right text-[#526174] font-semibold text-[13px] tracking-wide">&Oslash; Avg</th>
 <th className="p-4 px-6 text-right text-[#526174] font-semibold text-[13px] tracking-wide">Net M&sup3;</th>
 <th className="p-4 px-6 text-center text-[#526174] font-semibold text-[13px] tracking-wide">Status</th>
 <th className="p-4 px-6 text-center text-[#526174] font-semibold text-[13px] tracking-wide">Action</th>
 </tr>
 </thead>
 <tbody>
 {filtered.length === 0 ? <tr>
 <td colSpan={9} className="p-16 text-center">
 <div className="flex flex-col items-center justify-center">
 <Package className="w-10 h-10 text-muted-foreground mb-4 opacity-40" />
 <h3 className="text-base font-semibold text-foreground mb-1">No raw logs yet</h3>
 <p className="text-[13.5px] text-muted-foreground max-w-sm mb-6">There are no raw timber logs matching the current warehouse or filter.</p>
 <Button onClick={(e) => { e.stopPropagation(); router.push('/inventory/logs/create'); }} className="h-10 px-6">
 <Plus className="w-4 h-4 mr-2" /> Register Raw Log
 </Button>
 </div>
 </td>
 </tr> : 
 filtered.map(log => (
 <tr key={log.id} className="border-b last:border-0 hover:bg-muted/60 cursor-pointer transition-colors" onClick={() => router.push(`/inventory/logs/${log.id}`)}>
 <td className="py-3.5 px-6 text-[13px] text-muted-foreground">{new Date(log.receivingDate || log.createdAt || Date.now()).toLocaleDateString('id-ID')}</td>
 <td className="py-3.5 px-6 font-semibold text-primary text-[13px]">{log.logNumber}</td>
 <td className="py-3.5 px-6 text-[13px]">{log.species}</td>
 <td className="py-3.5 px-6 text-[13px]">{log.batch || '-'}</td>
 <td className="py-3.5 px-6 text-right text-[13px]">{log.originalLength} m</td>
 <td className="py-3.5 px-6 text-right text-[13px]">{log.averageDiameter} cm</td>
 <td className="py-3.5 px-6 text-right font-bold text-primary text-[13px]">{log.netVolume}</td>
 <td className="py-3.5 px-6 text-center text-[13px]">{getStatusBadge(log.status)}</td>
 <td className="py-3.5 px-6 text-center text-[13px]" onClick={e => e.stopPropagation()}>
  <DropdownMenu>
    <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 border-0 bg-transparent">
      <MoreHorizontal className="h-4 w-4" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => router.push(`/inventory/logs/${log.id}`)}>
        <Eye className="w-4 h-4 mr-2" /> View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => router.push(`/inventory/logs/${log.id}/edit`)}>
        <Pencil className="w-4 h-4 mr-2" /> Edit Log
      </DropdownMenuItem>
      {log.status === 'AVAILABLE' && (
        <DropdownMenuItem onClick={(e) => handleDelete(e, log.id)} className="text-destructive">
          <Trash className="w-4 h-4 mr-2" /> Delete Log
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
</td>
 </tr>
 ))
 }
 </tbody>
 </table>
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}


